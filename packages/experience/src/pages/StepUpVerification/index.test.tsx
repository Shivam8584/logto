/**
 * Page-level coverage for {@link StepUpVerification} (RFC 9470).
 *
 * The page is intentionally thin: on mount it kicks off the step-up interaction, renders nothing
 * until the MFA flow state lands (the error handler navigates here with `availableFactors` in
 * router state), and then renders the factor selector using the `MfaVerification` flow.
 */

import { LogtoAcrValues, MfaFactor, type LogtoAcrValue } from '@logto/schemas';
import { type ReactNode } from 'react';

import renderWithPageContext from '@/__mocks__/RenderWithPageContext';
import { UserMfaFlow } from '@/types';

import StepUpVerification from '.';

const startStepUp = jest.fn();
const useMfaFlowState = jest.fn();
const mfaFactorList = jest.fn();

// Controls the requested ACR so the page's heading/description can be asserted per tier.
// eslint-disable-next-line @silverhand/fp/no-let
let mockStepUpAcr: LogtoAcrValue | undefined;

jest.mock('@/hooks/use-step-up-verification', () => ({
  __esModule: true,
  default: () => ({ startStepUp }),
}));

jest.mock('@/hooks/use-step-up-acr', () => ({
  __esModule: true,
  default: () => mockStepUpAcr,
}));

jest.mock('@/hooks/use-mfa-factors-state', () => ({
  __esModule: true,
  // eslint-disable-next-line react-hooks/rules-of-hooks -- this is the mocked hook itself, invoked by the component under test, not called directly in test code
  default: () => useMfaFlowState(),
}));

jest.mock('@/containers/MfaFactorList', () => ({
  __esModule: true,
  default: (props: unknown) => {
    mfaFactorList(props);
    return <div>mfa-factor-list</div>;
  },
}));

const secondaryPageLayout = jest.fn();

jest.mock('@/Layout/SecondaryPageLayout', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: ReactNode }) => {
    secondaryPageLayout(props);
    return <div>{children}</div>;
  },
}));

describe('<StepUpVerification />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.Mfa;
  });

  it('starts the step-up flow once on mount', () => {
    useMfaFlowState.mockReturnValue(undefined);

    renderWithPageContext(<StepUpVerification />);

    expect(startStepUp).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while the MFA flow state is still initialising', () => {
    useMfaFlowState.mockReturnValue(undefined);

    const { queryByText } = renderWithPageContext(<StepUpVerification />);

    expect(queryByText('mfa-factor-list')).toBeNull();
  });

  it('renders the factor list with the MfaVerification flow once flow state is present', () => {
    const flowState = { availableFactors: [MfaFactor.TOTP] };
    useMfaFlowState.mockReturnValue(flowState);

    const { queryByText } = renderWithPageContext(<StepUpVerification />);

    expect(queryByText('mfa-factor-list')).not.toBeNull();
    expect(mfaFactorList).toHaveBeenCalledWith(
      expect.objectContaining({ flow: UserMfaFlow.MfaVerification, flowState })
    );
  });

  it('uses the MFA heading and description for an `mfa` step-up', () => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.Mfa;
    useMfaFlowState.mockReturnValue({ availableFactors: [MfaFactor.TOTP] });

    renderWithPageContext(<StepUpVerification />);

    expect(secondaryPageLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'mfa.step_up_mfa_title',
        description: 'mfa.step_up_mfa_description',
      })
    );
  });

  it('uses the phishing-resistant heading and description for a `phr` step-up', () => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.PhishingResistant;
    useMfaFlowState.mockReturnValue({ availableFactors: [MfaFactor.WebAuthn] });

    renderWithPageContext(<StepUpVerification />);

    expect(secondaryPageLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'mfa.step_up_phr_title',
        description: 'mfa.step_up_phr_description',
      })
    );
  });
});
