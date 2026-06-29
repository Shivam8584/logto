import { type SignInIdentifier, VerificationType } from '@logto/schemas';
import { isObject } from '@silverhand/essentials';
import { HTTPError } from 'ky';
import { useCallback, useContext, useMemo, useState } from 'react';

import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import WebAuthnContext from '@/Providers/WebAuthnContextProvider/WebAuthnContext';
import { createIdentifierPasskeyAuthentication } from '@/apis/experience';
import useNavigateWithPreservedSearchParams from '@/hooks/use-navigate-with-preserved-search-params';
import { UserFlow } from '@/types';
import type { IdentifierPasskeyState } from '@/types/guard';

import useApi from './use-api';
import useErrorHandler from './use-error-handler';
import useToast from './use-toast';

type Props = {
  readonly hideErrorToast: boolean;
};

/**
 * Hook to start identifier-based passkey verification flow.
 *
 * When the user has entered an identifier and passkey sign-in is enabled,
 * this hook fetches the WebAuthn authentication options for that user
 * and navigates to the passkey verification page.
 *
 * Returns `true` if the passkey flow was initiated successfully, `false` if
 * the user has no passkeys registered (so caller can fall back to other methods).
 *
 * Only passes WebAuthn options in navigation state. Identifier and available
 * methods are read from UserInteractionContext and useSieMethods() by the target page.
 */
const useStartIdentifierPasskeySignInProcessing = ({ hideErrorToast }: Props) => {
  const { setToast } = useToast();
  const navigate = useNavigateWithPreservedSearchParams();
  const asyncCreateAuthentication = useApi(createIdentifierPasskeyAuthentication);
  const { setVerificationId, setHasBoundPasskey } = useContext(UserInteractionContext);
  const { abortConditionalUI } = useContext(WebAuthnContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const handleError = useErrorHandler();

  /**
   * @returns
   * `true` if passkey flow was started
   * `false` if user has no passkeys (caller should fall back to other verification methods)
   * `undefined` if already processing
   */
  const startProcessing = useCallback(
    async (identifier: { type: SignInIdentifier; value: string }): Promise<boolean | undefined> => {
      if (isProcessing) {
        return undefined;
      }

      // Abort any ongoing conditional UI (e.g. passkey autofill prompt) in the previous step.
      abortConditionalUI();

      setIsProcessing(true);
      const [error, result] = await asyncCreateAuthentication(identifier);
      setIsProcessing(false);

      if (error) {
        // Only the "no passkeys registered" case is a legitimate reason to fall back to
        // password / verification code. For any OTHER error (network, 5xx, rate-limit),
        // we surface a toast and return `undefined` so the caller does NOT silently
        // proceed as if the user simply had no passkey — falling back there would just
        // hit the same failing backend and hide the real cause.
        const userHasNoPasskey =
          error instanceof HTTPError &&
          isObject(error.data) &&
          'code' in error.data &&
          error.data.code === 'session.mfa.webauthn_verification_not_found';

        await handleError(error, {
          // No passkeys registered: toast only when not suppressed, then fall back.
          'session.mfa.webauthn_verification_not_found': async (innerError) => {
            if (!hideErrorToast) {
              setToast(innerError.message);
            }
          },
        });

        return userHasNoPasskey ? false : undefined;
      }

      if (result) {
        const { verificationId, options } = result;
        setVerificationId(VerificationType.SignInPasskey, verificationId);
        setHasBoundPasskey(true);

        const state: IdentifierPasskeyState = { options };

        navigate({ pathname: `/${UserFlow.SignIn}/passkey` }, { state });
        return true;
      }
      return false;
    },
    [
      abortConditionalUI,
      asyncCreateAuthentication,
      handleError,
      hideErrorToast,
      isProcessing,
      navigate,
      setHasBoundPasskey,
      setToast,
      setVerificationId,
    ]
  );

  return useMemo(
    () => ({
      startProcessing,
      isProcessing,
    }),
    [startProcessing, isProcessing]
  );
};

export default useStartIdentifierPasskeySignInProcessing;
