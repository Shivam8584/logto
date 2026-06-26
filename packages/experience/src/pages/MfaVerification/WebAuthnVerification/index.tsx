import { VerificationType } from '@logto/schemas';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import SectionLayout from '@/Layout/SectionLayout';
import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import SwitchMfaFactorsLink from '@/components/SwitchMfaFactorsLink';
import useWebAuthnOperation from '@/hooks/use-webauthn-operation';
import ErrorPage from '@/pages/ErrorPage';
import Button from '@/shared/components/Button';
import { UserMfaFlow } from '@/types';
import { webAuthnStateGuard } from '@/types/guard';
import { isWebAuthnOptions } from '@/utils/webauthn';

const WebAuthnVerification = () => {
  const { state } = useLocation();
  const { data: webAuthnState } = webAuthnStateGuard.safeParse(state);
  const { verificationIdsMap } = useContext(UserInteractionContext);
  const verificationId = verificationIdsMap[VerificationType.WebAuthn];

  const handleWebAuthn = useWebAuthnOperation();
  const [isVerifying, setIsVerifying] = useState(false);

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
    <SecondaryPageLayout title="mfa.verify_mfa_factors">
      <SectionLayout
        title="mfa.verify_via_passkey"
        description="mfa.verify_via_passkey_description"
      >
        <Button
          title="action.verify_via_passkey"
          className="my-4"
          isLoading={isVerifying}
          onClick={async () => {
            setIsVerifying(true);
            await handleWebAuthn(options, verificationId);
            setIsVerifying(false);
          }}
        />
      </SectionLayout>
      <SwitchMfaFactorsLink
        flow={UserMfaFlow.MfaVerification}
        flowState={{ availableFactors, skippable }}
      />
    </SecondaryPageLayout>
  );
};

export default WebAuthnVerification;
