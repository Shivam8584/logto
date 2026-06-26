/**
 * Initialise a step-up authentication interaction (RFC 9470) and redirect the
 * user to the appropriate MFA verification page.
 *
 * Called once when the `StepUpVerification` page mounts. It:
 *   1. Calls `PUT /api/experience` with `InteractionEvent.SignIn` (the backend
 *      detects the `step_up_acr` param from the OIDC session and calls
 *      `initStepUp()` automatically).
 *   2. Attempts `POST /api/experience/submit`. If ACR is already satisfied the
 *      server returns `{ redirectTo }` and we navigate immediately.
 *      If MFA is still required the server returns a 403 which the
 *      `mfaVerificationErrorHandler` handles by navigating to the right factor.
 *   3. If the user has no MFA factors enrolled, shows a clear error instead of
 *      a generic toast.
 */

import { InteractionEvent, LogtoAcrValues } from '@logto/schemas';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { initInteraction, submitInteraction } from '@/apis/experience';
import { mfaErrorDataGuard } from '@/types/guard';

import useApi from './use-api';
import useErrorHandler from './use-error-handler';
import useMfaErrorHandler from './use-mfa-error-handler';
import useStepUpAcr from './use-step-up-acr';
import useToast from './use-toast';

const useStepUpVerification = () => {
  const asyncInitInteraction = useApi(initInteraction);
  const asyncSubmitInteraction = useApi(submitInteraction);
  const mfaErrorHandlers = useMfaErrorHandler({ replace: true, verificationBasePath: 'step-up' });
  const handleError = useErrorHandler();
  const stepUpAcr = useStepUpAcr();
  const { setToast } = useToast();
  const { t } = useTranslation();

  const startStepUp = useCallback(async () => {
    const [initError] = await asyncInitInteraction(InteractionEvent.SignIn);
    if (initError) {
      await handleError(initError);
      return;
    }

    const [submitError, result] = await asyncSubmitInteraction();

    if (result?.redirectTo) {
      // ACR was already satisfied — token issued, redirect immediately.
      window.location.replace(result.redirectTo);
      return;
    }

    if (submitError) {
      // Special case: 403 `session.mfa.require_mfa_verification` with empty
      // `availableFactors` means the user has no MFA enrolled. The generic
      // mfaErrorHandler would just show error.message (a raw API string).
      // Show a human-readable, localised message instead.
      const isHTTPError = submitError instanceof Error && 'data' in submitError;

      if (isHTTPError) {
        // eslint-disable-next-line no-restricted-syntax
        const errorData = (submitError as { data?: unknown }).data;
        const { data: mfaData } = mfaErrorDataGuard.safeParse(
          // eslint-disable-next-line no-restricted-syntax
          (errorData as { data?: unknown }).data
        );
        if (mfaData && mfaData.availableFactors.length === 0) {
          // Tailor the message to the requested assurance level: a phishing-resistant (`phr`)
          // step-up needs a security key specifically, whereas `mfa` accepts any second factor.
          setToast(
            t(
              stepUpAcr === LogtoAcrValues.PhishingResistant
                ? 'mfa.step_up_phr_no_factors'
                : 'mfa.step_up_mfa_no_factors'
            )
          );
          return;
        }
      }

      // Expected path: 403 `session.mfa.require_mfa_verification` → navigate to /step-up/<factor>.
      // The handler was constructed with verificationBasePath:'step-up' so routing is correct.
      await handleError(submitError, mfaErrorHandlers);
    }
  }, [
    asyncInitInteraction,
    asyncSubmitInteraction,
    handleError,
    mfaErrorHandlers,
    setToast,
    stepUpAcr,
    t,
  ]);

  return { startStepUp };
};

export default useStepUpVerification;
