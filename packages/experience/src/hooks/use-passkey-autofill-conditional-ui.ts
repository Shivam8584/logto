import {
  InteractionEvent,
  MfaFactor,
  webAuthnAuthenticationOptionsTimeout,
  type WebAuthnAuthenticationOptions,
} from '@logto/schemas';
import { browserSupportsWebAuthnAutofill } from '@simplewebauthn/browser';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import WebAuthnContext from '@/Providers/WebAuthnContextProvider/WebAuthnContext';
import { initInteraction, verifySignInPasskey } from '@/apis/experience';
import { toPublicKeyRequest, toAuthenticationResponseJSON } from '@/utils/webauthn';

import useApi from './use-api';
import useErrorHandler, { type ErrorHandlers } from './use-error-handler';
import useGlobalRedirectTo from './use-global-redirect-to';
import { useSieMethods } from './use-sie';
import useSubmitInteractionErrorHandler from './use-submit-interaction-error-handler';
import useToast from './use-toast';

const usePasskeyAutofillConditionalUI = () => {
  const { t } = useTranslation();
  const { setToast } = useToast();
  const {
    authenticationOptions,
    abortConditionalUI,
    setConditionalUIAbortController,
    setIsPasskeyFlowProcessing,
  } = useContext(WebAuthnContext);
  const { passkeySignIn } = useSieMethods();
  const asyncVerifySignInPasskey = useApi(verifySignInPasskey);
  const handleError = useErrorHandler();
  const redirectTo = useGlobalRedirectTo();

  const preSignInErrorHandlers = useSubmitInteractionErrorHandler(InteractionEvent.SignIn, {
    replace: true,
  });

  // The autofill credential the browser surfaced may no longer resolve to a
  // usable passkey by the time the backend verifies it (e.g. it was removed, or
  // belongs to a user with no enabled WebAuthn factor). That is NOT a sign-in
  // failure the user should see — conditional UI must degrade silently to the
  // normal password/OTP flow (per the WebAuthn conditional-mediation contract).
  // Swallow it here instead of routing to the generic handler, mirroring the
  // identifier-submit path (use-start-identifier-passkey-sign-in-processing).
  const passkeyNotFoundHandler: ErrorHandlers = useMemo(
    () => ({
      'session.mfa.webauthn_verification_not_found': async () => {
        // No-op: fall back to the standard sign-in methods silently
      },
    }),
    []
  );

  const triggerPasskeySignInViaConditionalUi = useCallback(
    async (options: WebAuthnAuthenticationOptions) => {
      if (!(await browserSupportsWebAuthnAutofill())) {
        return;
      }
      try {
        // Abort any previous conditional UI request before starting a new one
        abortConditionalUI();

        const abortController = new AbortController();
        setConditionalUIAbortController(abortController);

        window.setTimeout(() => {
          abortController.abort();
        }, webAuthnAuthenticationOptionsTimeout);

        const credential = await navigator.credentials.get({
          mediation: 'conditional',
          signal: abortController.signal,
          publicKey: toPublicKeyRequest(options),
        });

        if (!(credential instanceof PublicKeyCredential)) {
          return;
        }

        setIsPasskeyFlowProcessing(true);
        await initInteraction(InteractionEvent.SignIn);

        const [error, result] = await asyncVerifySignInPasskey({
          ...toAuthenticationResponseJSON(credential),
          type: MfaFactor.WebAuthn,
        });

        if (error) {
          // Generic sign-in handlers first, then our silent passkey-not-found
          // override last so it definitively wins for that specific code (later
          // keys win the merge); every other error still surfaces normally.
          await handleError(error, { ...preSignInErrorHandlers, ...passkeyNotFoundHandler });
          return;
        }

        if (result) {
          await redirectTo(result.redirectTo);
        }
      } catch (error: unknown) {
        if (
          (error instanceof DOMException && error.name === 'AbortError') ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          return;
        }
        setToast(t('passkey_sign_in.trigger_conditional_ui_failed'));
      } finally {
        setIsPasskeyFlowProcessing(false);
      }
    },
    [
      asyncVerifySignInPasskey,
      handleError,
      preSignInErrorHandlers,
      passkeyNotFoundHandler,
      redirectTo,
      setToast,
      t,
      abortConditionalUI,
      setConditionalUIAbortController,
      setIsPasskeyFlowProcessing,
    ]
  );

  useEffect(() => {
    if (authenticationOptions && passkeySignIn?.enabled && passkeySignIn.allowAutofill) {
      void triggerPasskeySignInViaConditionalUi(authenticationOptions);
    }
  }, [
    authenticationOptions,
    passkeySignIn?.enabled,
    passkeySignIn?.allowAutofill,
    triggerPasskeySignInViaConditionalUi,
  ]);

  return useMemo(
    () => ({
      isPasskeyAutofillEnabled: passkeySignIn?.enabled && passkeySignIn.allowAutofill,
      triggerPasskeySignInViaConditionalUi,
      abortConditionalUI,
    }),
    [
      passkeySignIn?.enabled,
      passkeySignIn?.allowAutofill,
      triggerPasskeySignInViaConditionalUi,
      abortConditionalUI,
    ]
  );
};

export default usePasskeyAutofillConditionalUI;
