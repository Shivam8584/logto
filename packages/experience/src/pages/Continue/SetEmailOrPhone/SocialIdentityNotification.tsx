import { SignInIdentifier } from '@logto/schemas';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { VerificationCodeIdentifier } from '@/types';
import { registeredSocialIdentityStateGuard } from '@/types/guard';
import { maskEmail } from '@/utils/format';

const SocialIdentityNotification = ({
  missingProfileTypes,
}: {
  readonly missingProfileTypes: VerificationCodeIdentifier[];
}) => {
  const { t } = useTranslation();
  const { state } = useLocation();

  const stateResult = registeredSocialIdentityStateGuard.safeParse(state);

  if (!stateResult.success) {
    return null;
  }

  const { registeredSocialIdentity } = stateResult.data;

  if (missingProfileTypes.includes(SignInIdentifier.Email) && registeredSocialIdentity?.email) {
    return (
      <div className="mt-6 text-sm text-muted">
        {t('description.social_identity_exist', {
          type: t('description.email'),
          value: maskEmail(registeredSocialIdentity.email),
        })}
      </div>
    );
  }

  if (missingProfileTypes.includes(SignInIdentifier.Phone) && registeredSocialIdentity?.phone) {
    return (
      <div className="mt-6 text-sm text-muted">
        {t('description.social_identity_exist', {
          type: t('description.phone_number'),
          value: registeredSocialIdentity.phone,
        })}
      </div>
    );
  }

  return null;
};

export default SocialIdentityNotification;
