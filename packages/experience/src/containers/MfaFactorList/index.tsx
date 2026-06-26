import { LogtoAcrValues, MfaFactor, SignInIdentifier } from '@logto/schemas';
import { useCallback, useState } from 'react';

import MfaFactorButton from '@/components/Button/MfaFactorButton';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import useSendMfaVerificationCode from '@/hooks/use-send-mfa-verification-code';
import useStartTotpBinding from '@/hooks/use-start-totp-binding';
import useStartWebAuthnProcessing from '@/hooks/use-start-webauthn-processing';
import useStepUpAcr from '@/hooks/use-step-up-acr';
import { UserMfaFlow } from '@/types';
import { type MfaFlowState } from '@/types/guard';

type Props = {
  readonly flow: UserMfaFlow;
  readonly flowState: MfaFlowState;
};

const MfaFactorList = ({ flow, flowState }: Props) => {
  const startTotpBinding = useStartTotpBinding();
  const startWebAuthnProcessing = useStartWebAuthnProcessing();
  const navigate = useNavigateWithPreservedSearchParams();
  const stepUpAcr = useStepUpAcr();
  const { isWebAuthnUsedAsSignInPasskey } = flowState;
  const { onSubmit: sendMfaVerificationCode } = useSendMfaVerificationCode();

  // Only one factor selection may be in flight: each branch fires an async send /
  // WebAuthn prompt then navigates, so without this a double-tap sends two codes
  // (invalidating the first) or opens overlapping WebAuthn prompts.
  const [isSelecting, setIsSelecting] = useState(false);

  /**
   * For a phishing-resistant (`phr`) step-up, only WebAuthn satisfies the requested ACR, so the
   * selector must hide phishable factors even if the user has them enrolled. The backend already
   * scopes the 403 `availableFactors` to WebAuthn for `phr`, so this list is normally bypassed by a
   * direct redirect; the filter is a defensive guard against ever offering a non-satisfying factor.
   */
  const availableFactors =
    stepUpAcr === LogtoAcrValues.PhishingResistant
      ? flowState.availableFactors.filter((factor) => factor === MfaFactor.WebAuthn)
      : flowState.availableFactors;

  const handleSelectFactor = useCallback(
    async (factor: MfaFactor) => {
      if (factor === MfaFactor.TOTP && flow === UserMfaFlow.MfaBinding) {
        return startTotpBinding(flowState);
      }

      if (factor === MfaFactor.WebAuthn) {
        return startWebAuthnProcessing(flow, flowState);
      }

      if (factor === MfaFactor.EmailVerificationCode && flow === UserMfaFlow.MfaVerification) {
        await sendMfaVerificationCode(SignInIdentifier.Email, flowState);
        return;
      }

      if (factor === MfaFactor.PhoneVerificationCode && flow === UserMfaFlow.MfaVerification) {
        await sendMfaVerificationCode(SignInIdentifier.Phone, flowState);
        return;
      }

      navigate(`/${flow}/${factor}`, { state: flowState });
    },
    [flow, flowState, navigate, sendMfaVerificationCode, startTotpBinding, startWebAuthnProcessing]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {availableFactors.map((factor) => {
        const isEmailOrPhone =
          factor === MfaFactor.EmailVerificationCode || factor === MfaFactor.PhoneVerificationCode;
        const maskedIdentifier = isEmailOrPhone ? flowState.maskedIdentifiers?.[factor] : undefined;
        const isWebAuthnBound = factor === MfaFactor.WebAuthn && !!isWebAuthnUsedAsSignInPasskey;
        const isDisabled = !!flowState.suggestion && (!!maskedIdentifier || isWebAuthnBound);

        return (
          <MfaFactorButton
            key={factor}
            factor={factor}
            isBinding={flow === UserMfaFlow.MfaBinding}
            isDisabled={isDisabled || isSelecting}
            maskedIdentifier={maskedIdentifier}
            onClick={async () => {
              if (isSelecting) {
                return;
              }
              setIsSelecting(true);
              try {
                await handleSelectFactor(factor);
              } finally {
                setIsSelecting(false);
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default MfaFactorList;
