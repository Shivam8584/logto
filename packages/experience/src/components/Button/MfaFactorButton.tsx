import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { MfaFactor } from '@logto/schemas';
import classNames from 'classnames';
import { type TFuncKey } from 'i18next';
import { useTranslation } from 'react-i18next';

import FactorBackupCode from '@/assets/icons/factor-backup-code.svg?react';
import FactorEmail from '@/assets/icons/factor-email.svg?react';
import FactorPhone from '@/assets/icons/factor-phone.svg?react';
import FactorTotp from '@/assets/icons/factor-totp.svg?react';
import FactorWebAuthn from '@/assets/icons/factor-webauthn.svg?react';
import DynamicT from '@/shared/components/DynamicT';
import FlipOnRtl from '@/shared/components/FlipOnRtl';

const buttonBaseClass =
  'relative flex flex-row items-center justify-center h-12 px-4 rounded-[11px] cursor-pointer font-medium text-base overflow-hidden select-none appearance-none [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color,transform,box-shadow] duration-200 ease-in-out active:not-disabled:scale-[0.985] active:not-disabled:duration-[80ms] desktop:text-[15px]';

export type Props = {
  readonly factor: MfaFactor;
  readonly isBinding: boolean;
  readonly isDisabled?: boolean;
  readonly maskedIdentifier?: string;
  readonly onClick?: () => void;
};

const factorIcon: Record<MfaFactor, SvgComponent> = {
  [MfaFactor.TOTP]: FactorTotp,
  [MfaFactor.WebAuthn]: FactorWebAuthn,
  [MfaFactor.BackupCode]: FactorBackupCode,
  [MfaFactor.EmailVerificationCode]: FactorEmail,
  [MfaFactor.PhoneVerificationCode]: FactorPhone,
};

const factorName: Record<MfaFactor, TFuncKey> = {
  [MfaFactor.TOTP]: 'mfa.totp',
  [MfaFactor.WebAuthn]: 'mfa.webauthn',
  [MfaFactor.BackupCode]: 'mfa.backup_code',
  [MfaFactor.EmailVerificationCode]: 'mfa.email_verification_code',
  [MfaFactor.PhoneVerificationCode]: 'mfa.phone_verification_code',
};

const factorDescription: Record<MfaFactor, TFuncKey> = {
  [MfaFactor.TOTP]: 'mfa.verify_totp_description',
  [MfaFactor.WebAuthn]: 'mfa.verify_webauthn_description',
  [MfaFactor.BackupCode]: 'mfa.verify_backup_code_description',
  [MfaFactor.EmailVerificationCode]: 'mfa.verify_email_verification_code_description',
  [MfaFactor.PhoneVerificationCode]: 'mfa.verify_phone_verification_code_description',
};

const linkFactorDescription: Record<MfaFactor, TFuncKey> = {
  [MfaFactor.TOTP]: 'mfa.link_totp_description',
  [MfaFactor.WebAuthn]: 'mfa.link_webauthn_description',
  [MfaFactor.BackupCode]: 'mfa.link_backup_code_description',
  [MfaFactor.EmailVerificationCode]: 'mfa.link_email_verification_code_description',
  [MfaFactor.PhoneVerificationCode]: 'mfa.link_phone_verification_code_description',
};

const MfaFactorButton = ({ factor, isBinding, isDisabled, maskedIdentifier, onClick }: Props) => {
  const { t } = useTranslation();
  const Icon = factorIcon[factor];

  const getDescriptionForMaskedIdentifier = () => {
    if (!maskedIdentifier) {
      return null;
    }

    if (factor === MfaFactor.EmailVerificationCode) {
      return t('mfa.send_to_email', { identifier: maskedIdentifier });
    }

    if (factor === MfaFactor.PhoneVerificationCode) {
      return t('mfa.send_to_phone', { identifier: maskedIdentifier });
    }

    return maskedIdentifier;
  };

  return (
    <button
      className={classNames(
        buttonBaseClass,
        'btn-ghost',
        'w-full',
        'py-3.5 ps-3 pe-4 h-auto gap-4 rounded-[13px] border-line-strong',
        isDisabled && 'disabled cursor-not-allowed border-line bg-surface-2'
      )}
      type="button"
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
    >
      <Icon className="w-5 h-5 text-muted" />
      <div className="flex-1 flex flex-col items-start text-start">
        <div className="text-base font-medium text-ink desktop:text-sm">
          <DynamicT forKey={factorName[factor]} />
        </div>
        <div className="text-sm text-muted">
          {maskedIdentifier ? (
            <span>{getDescriptionForMaskedIdentifier()}</span>
          ) : (
            <DynamicT forKey={(isBinding ? linkFactorDescription : factorDescription)[factor]} />
          )}
        </div>
      </div>
      <FlipOnRtl>
        <ChevronRightIcon className="w-4 h-4 text-faint [&]:[.disabled_&]:invisible" />
      </FlipOnRtl>
    </button>
  );
};

export default MfaFactorButton;
