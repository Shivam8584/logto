/**
 * Unit coverage for {@link useStepUpVerification} — the orchestration hook that bootstraps a
 * step-up (RFC 9470) interaction and routes the user to the right MFA factor.
 *
 * Three branches matter:
 *   1. ACR already satisfied → the server returns `{ redirectTo }` and we redirect immediately.
 *   2. MFA still required → 403 `require_mfa_verification` is delegated to the MFA error handler,
 *      which (constructed with `verificationBasePath: 'step-up'`) routes to `/step-up/<factor>`.
 *   3. No MFA factors enrolled → a 403 with empty `availableFactors` shows a localised toast
 *      instead of leaking a raw API string.
 */

import { InteractionEvent, LogtoAcrValues, MfaFactor, type LogtoAcrValue } from '@logto/schemas';
import { renderHook, act } from '@testing-library/react';

import { initInteraction, submitInteraction } from '@/apis/experience';

import useStepUpVerification from './use-step-up-verification';

const mockInitInteraction = initInteraction as jest.MockedFunction<typeof initInteraction>;
const mockSubmitInteraction = submitInteraction as jest.MockedFunction<typeof submitInteraction>;

const handleError = jest.fn();
const mfaErrorHandlers = { mock: 'mfa-error-handlers' };
const setToast = jest.fn();
const replace = jest.fn();

// The step-up ACR drives which no-factor message is shown; default to `mfa` per test.
// eslint-disable-next-line @silverhand/fp/no-let
let mockStepUpAcr: LogtoAcrValue | undefined = LogtoAcrValues.Mfa;

jest.mock('@/apis/experience', () => ({
  initInteraction: jest.fn(),
  submitInteraction: jest.fn(),
}));

// `useApi` wraps an async fn and returns `[error, result]`; reproduce that contract directly so the
// hook's control flow (rather than the loading plumbing) is what's under test.
jest.mock('@/hooks/use-api', () => ({
  __esModule: true,
  default:
    (api: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      try {
        return [null, await api(...args)];
      } catch (error: unknown) {
        return [error];
      }
    },
}));

jest.mock('@/hooks/use-error-handler', () => ({
  __esModule: true,
  default: () => handleError,
}));

jest.mock('@/hooks/use-mfa-error-handler', () => ({
  __esModule: true,
  default: jest.fn(() => mfaErrorHandlers),
}));

jest.mock('@/hooks/use-toast', () => ({
  __esModule: true,
  default: () => ({ setToast }),
}));

jest.mock('@/hooks/use-step-up-acr', () => ({
  __esModule: true,
  default: () => mockStepUpAcr,
}));

const originalLocation = window.location;

beforeAll(() => {
  // eslint-disable-next-line @silverhand/fp/no-mutating-methods
  Object.defineProperty(window, 'location', {
    value: { replace },
    writable: true,
  });
});

afterAll(() => {
  // eslint-disable-next-line @silverhand/fp/no-mutating-methods
  Object.defineProperty(window, 'location', { value: originalLocation });
});

/** Build an HTTP-error-like object matching what `ky` surfaces (an `Error` carrying nested `data`). */
class MfaError extends Error {
  constructor(public readonly data: { data: { availableFactors: MfaFactor[] } }) {
    super('require mfa');
  }
}

const createMfaError = (availableFactors: MfaFactor[]) =>
  new MfaError({ data: { availableFactors } });

describe('useStepUpVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.Mfa;
  });

  it('initialises the interaction as a SignIn event (backend promotes it to step-up)', async () => {
    mockInitInteraction.mockResolvedValue(undefined as never);
    mockSubmitInteraction.mockResolvedValue({ redirectTo: 'https://logto.test/redirect' });

    const { result } = renderHook(() => useStepUpVerification());
    await act(async () => {
      await result.current.startStepUp();
    });

    expect(mockInitInteraction).toHaveBeenCalledWith(InteractionEvent.SignIn);
  });

  it('redirects immediately when the ACR is already satisfied', async () => {
    mockInitInteraction.mockResolvedValue(undefined as never);
    mockSubmitInteraction.mockResolvedValue({ redirectTo: 'https://logto.test/redirect' });

    const { result } = renderHook(() => useStepUpVerification());
    await act(async () => {
      await result.current.startStepUp();
    });

    expect(replace).toHaveBeenCalledWith('https://logto.test/redirect');
    expect(handleError).not.toHaveBeenCalled();
    expect(setToast).not.toHaveBeenCalled();
  });

  it('delegates a 403 with available factors to the MFA error handler', async () => {
    mockInitInteraction.mockResolvedValue(undefined as never);
    const error = createMfaError([MfaFactor.TOTP]);
    mockSubmitInteraction.mockRejectedValue(error);

    const { result } = renderHook(() => useStepUpVerification());
    await act(async () => {
      await result.current.startStepUp();
    });

    expect(replace).not.toHaveBeenCalled();
    expect(setToast).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledWith(error, mfaErrorHandlers);
  });

  it('shows a localised toast (not the MFA handler) when no factors are enrolled', async () => {
    mockInitInteraction.mockResolvedValue(undefined as never);
    mockSubmitInteraction.mockRejectedValue(createMfaError([]));

    const { result } = renderHook(() => useStepUpVerification());
    await act(async () => {
      await result.current.startStepUp();
    });

    expect(setToast).toHaveBeenCalledWith('mfa.step_up_mfa_no_factors');
    expect(handleError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the phishing-resistant no-factors message for a `phr` step-up', async () => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    mockStepUpAcr = LogtoAcrValues.PhishingResistant;
    mockInitInteraction.mockResolvedValue(undefined as never);
    mockSubmitInteraction.mockRejectedValue(createMfaError([]));

    const { result } = renderHook(() => useStepUpVerification());
    await act(async () => {
      await result.current.startStepUp();
    });

    expect(setToast).toHaveBeenCalledWith('mfa.step_up_phr_no_factors');
    expect(handleError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('surfaces an init failure and never attempts to submit', async () => {
    const initError = new Error('init failed');
    mockInitInteraction.mockRejectedValue(initError);

    const { result } = renderHook(() => useStepUpVerification());
    await act(async () => {
      await result.current.startStepUp();
    });

    expect(handleError).toHaveBeenCalledWith(initError);
    expect(mockSubmitInteraction).not.toHaveBeenCalled();
  });
});
