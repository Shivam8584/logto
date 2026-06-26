import { InteractionEvent } from '@logto/schemas';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import SectionLayout from '@/Layout/SectionLayout';
import { createSignInPasskeyRegistrationOptions, skipPasskeyBinding } from '@/apis/experience';
import PasskeyScene from '@/components/illustrations/PasskeyScene';
import useApi from '@/hooks/use-api';
import useErrorHandler from '@/hooks/use-error-handler';
import useGlobalRedirectTo from '@/hooks/use-global-redirect-to';
import usePasskeySignIn from '@/hooks/use-passkey-sign-in';
import useSubmitInteractionErrorHandler from '@/hooks/use-submit-interaction-error-handler';
import ErrorPage from '@/pages/ErrorPage';
import { queryKeys } from '@/query-client';
import Button from '@/shared/components/Button';
import { continueFlowStateGuard } from '@/types/guard';

const PasskeySetup = () => {
  const { state } = useLocation();
  const redirectTo = useGlobalRedirectTo();
  const { data: continueFlowState } = continueFlowStateGuard.safeParse(state);

  const { handleBindPasskey } = usePasskeySignIn();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleError = useErrorHandler();
  const onSubmitErrorHandlers = useSubmitInteractionErrorHandler(
    continueFlowState?.interactionEvent ?? InteractionEvent.SignIn,
    {
      replace: true,
    }
  );

  const asyncSkipPasskeyBinding = useApi(skipPasskeyBinding);

  // Fetch the WebAuthn registration options on mount via TanStack Query, only when the
  // browser supports WebAuthn. Replaces the manual useState + useEffect fetch.
  const { data: registrationResult, error: registrationOptionsError } = useQuery({
    queryKey: queryKeys.passkeyRegistrationOptions,
    queryFn: createSignInPasskeyRegistrationOptions,
    enabled: browserSupportsWebAuthn(),
  });

  useEffect(() => {
    if (registrationOptionsError) {
      void handleError(registrationOptionsError);
    }
  }, [registrationOptionsError, handleError]);

  const onCreatePasskey = useCallback(async () => {
    if (!registrationResult) {
      return;
    }

    setIsSubmitting(true);
    await handleBindPasskey(
      registrationResult.options,
      registrationResult.verificationId,
      onSubmitErrorHandlers
    );
    setIsSubmitting(false);
  }, [handleBindPasskey, registrationResult, onSubmitErrorHandlers]);

  const onSkip = useCallback(async () => {
    const [error, result] = await asyncSkipPasskeyBinding();

    if (error) {
      await handleError(error, onSubmitErrorHandlers);
      return;
    }

    if (result) {
      await redirectTo(result.redirectTo);
    }
  }, [asyncSkipPasskeyBinding, handleError, onSubmitErrorHandlers, redirectTo]);

  if (!browserSupportsWebAuthn()) {
    return <ErrorPage title="mfa.webauthn_not_supported" />;
  }

  return (
    <SecondaryPageLayout title="passkey_sign_in.setup_page.title" onSkip={onSkip}>
      <SectionLayout
        title="passkey_sign_in.setup_page.subtitle"
        description="passkey_sign_in.setup_page.description"
      >
        <PasskeyScene />
        <Button
          className="my-4"
          title="passkey_sign_in.setup_page.subtitle"
          isLoading={isSubmitting}
          isDisabled={!registrationResult}
          onClick={onCreatePasskey}
        />
      </SectionLayout>
    </SecondaryPageLayout>
  );
};

export default PasskeySetup;
