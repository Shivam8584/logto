import { VerificationType } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import SwitchMfaFactorsLink from '@/components/SwitchMfaFactorsLink';
import useSkipMfa from '@/hooks/use-skip-mfa';
import useWebAuthnOperation from '@/hooks/use-webauthn-operation';
import ErrorPage from '@/pages/ErrorPage';
import Button from '@/shared/components/Button';
import { UserMfaFlow } from '@/types';
import { webAuthnStateGuard } from '@/types/guard';
import { isWebAuthnOptions } from '@/utils/webauthn';

const WebAuthnBinding = () => {
  const { state } = useLocation();
  const { data: webAuthnState } = webAuthnStateGuard.safeParse(state);
  const { verificationIdsMap } = useContext(UserInteractionContext);
  const verificationId = verificationIdsMap[VerificationType.WebAuthn];

  const handleWebAuthn = useWebAuthnOperation();
  const skipMfa = useSkipMfa();
  const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);

  if (!browserSupportsWebAuthn()) {
    return <ErrorPage title="mfa.webauthn_not_supported" />;
  }

  if (!webAuthnState || !verificationId) {
    return <ErrorPage title="error.invalid_session" />;
  }

  const { options, availableFactors, skippable } = webAuthnState;

  if (!isWebAuthnOptions(options)) {
    return <ErrorPage title="error.invalid_session" />;
  }

  return (
    <SecondaryPageLayout
      title="mfa.create_a_passkey"
      description="mfa.create_passkey_description"
      onSkip={conditional(skippable && skipMfa)}
    >
      <Button
        title="mfa.create_a_passkey"
        isLoading={isCreatingPasskey}
        onClick={async () => {
          setIsCreatingPasskey(true);
          await handleWebAuthn(options, verificationId);
          setIsCreatingPasskey(false);
        }}
      />
      <SwitchMfaFactorsLink
        flow={UserMfaFlow.MfaBinding}
        flowState={{ availableFactors, skippable }}
        className="mt-6"
      />
    </SecondaryPageLayout>
  );
};

export default WebAuthnBinding;
