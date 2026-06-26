import { VerificationType } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import { useContext } from 'react';
import { useLocation } from 'react-router-dom';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import Divider from '@/components/Divider';
import SwitchMfaFactorsLink from '@/components/SwitchMfaFactorsLink';
import useSkipMfa from '@/hooks/use-skip-mfa';
import useSkipOptionalMfa from '@/hooks/use-skip-optional-mfa';
import ErrorPage from '@/pages/ErrorPage';
import { UserMfaFlow } from '@/types';
import { totpBindingStateGuard } from '@/types/guard';

import SecretSection from './SecretSection';
import VerificationSection from './VerificationSection';

const TotpBinding = () => {
  const { state } = useLocation();
  const { data: totpBindingState } = totpBindingStateGuard.safeParse(state);
  const { verificationIdsMap } = useContext(UserInteractionContext);
  const verificationId = verificationIdsMap[VerificationType.TOTP];

  const skipMfa = useSkipMfa();
  const skipOptionalMfa = useSkipOptionalMfa();

  if (!totpBindingState || !verificationId) {
    return <ErrorPage title="error.invalid_session" />;
  }

  const { availableFactors, skippable, suggestion } = totpBindingState;

  return (
    <SecondaryPageLayout
      title="mfa.add_authenticator_app"
      onSkip={conditional(skippable && (suggestion ? skipOptionalMfa : skipMfa))}
    >
      <div className="flex flex-col justify-center items-stretch gap-6 mb-6">
        <SecretSection {...totpBindingState} />
        <Divider />
        <VerificationSection verificationId={verificationId} />
        {availableFactors.length > 1 && (
          <>
            <Divider />
            <SwitchMfaFactorsLink
              flow={UserMfaFlow.MfaBinding}
              flowState={{ availableFactors, skippable }}
              className="self-start"
            />
          </>
        )}
      </div>
    </SecondaryPageLayout>
  );
};

export default TotpBinding;
