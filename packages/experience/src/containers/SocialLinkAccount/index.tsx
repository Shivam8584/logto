import { SignInIdentifier, SignInMode } from '@logto/schemas';
import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import TextLink from '@/components/TextLink';
import { useSieMethods } from '@/hooks/use-sie';
import useSocialRegister from '@/hooks/use-social-register';
import Button from '@/shared/components/Button';
import DynamicT from '@/shared/components/DynamicT';
import type { SocialRelatedUserInfo } from '@/types/guard';
import { maskEmail, maskPhone } from '@/utils/format';

import useBindSocialRelatedUser from './use-social-link-related-user';

type Props = {
  readonly className?: string;
  readonly connectorId: string;
  readonly verificationId: string;
  readonly relatedUser: SocialRelatedUserInfo;
};

const getCreateAccountActionText = (signUpMethods: string[]): TFuncKey => {
  if (
    signUpMethods.includes(SignInIdentifier.Email) &&
    signUpMethods.includes(SignInIdentifier.Phone)
  ) {
    return 'action.link_another_email_or_phone';
  }

  if (signUpMethods.includes(SignInIdentifier.Email)) {
    return 'action.link_another_email';
  }

  if (signUpMethods.includes(SignInIdentifier.Phone)) {
    return 'action.link_another_phone';
  }

  return 'action.create_account_without_linking';
};

const SocialLinkAccount = ({ connectorId, verificationId, className, relatedUser }: Props) => {
  const { t } = useTranslation();
  const { signUpMethods, signInMode } = useSieMethods();

  const bindSocialRelatedUser = useBindSocialRelatedUser();
  const registerWithSocial = useSocialRegister(connectorId);

  // One action at a time: both the Bind button and the "create account without
  // linking" link submit against the same verificationId, so a second concurrent
  // call would 4xx against a consumed id and surface a confusing error.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionText = getCreateAccountActionText(signUpMethods);

  const { type, value } = relatedUser;

  return (
    <div
      className={classNames('flex flex-col items-center justify-center [&>*]:w-full', className)}
    >
      <div className="text-sm text-muted text-start mobile:mb-2 desktop:mb-4">
        {t('description.social_bind_with_existing')}
      </div>

      <Button
        title="action.bind"
        i18nProps={{ address: type === 'email' ? maskEmail(value) : maskPhone(value) }}
        isLoading={isSubmitting}
        onClick={async () => {
          if (isSubmitting) {
            return;
          }
          setIsSubmitting(true);
          try {
            await bindSocialRelatedUser(verificationId);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {signInMode !== SignInMode.SignIn && (
        <div className="text-sm text-muted text-start mt-6">
          <div>
            <DynamicT forKey="description.skip_social_linking" />
          </div>
          <TextLink
            text={actionText}
            onClick={async () => {
              if (isSubmitting) {
                return;
              }
              setIsSubmitting(true);
              try {
                await registerWithSocial(verificationId);
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SocialLinkAccount;
