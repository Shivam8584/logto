import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import SectionLayout from '@/Layout/SectionLayout';
import TextLink from '@/components/TextLink';
import usePlatform from '@/hooks/use-platform';
import useTextHandler from '@/hooks/use-text-handler';
import Button from '@/shared/components/Button';
import { type TotpBindingState } from '@/types/guard';

const SecretSection = ({ secret, secretQrCode }: TotpBindingState) => {
  const { t } = useTranslation();
  const { isMobile } = usePlatform();
  const [isQrCodeFormat, setIsQrCodeFormat] = useState(!isMobile);
  const { copyText } = useTextHandler();

  return (
    <SectionLayout
      title="mfa.step"
      titleProps={{
        step: 1,
        content: t(isQrCodeFormat ? 'mfa.scan_qr_code' : 'mfa.copy_and_paste_key'),
      }}
      description={
        isQrCodeFormat ? 'mfa.scan_qr_code_description' : 'mfa.copy_and_paste_key_description'
      }
    >
      <div className="flex flex-col items-center justify-center">
        {isQrCodeFormat && secretQrCode && (
          // Larger box + a white quiet-zone (p-3) around the QR — easier to scan and reads
          // as a deliberate card, not a cramped thumbnail.
          <div className="border border-line-strong rounded-[13px] overflow-hidden mx-auto my-4 h-[164px] w-[164px] bg-white p-3 shadow-[var(--sh-xs)]">
            <img
              className="w-full h-full block object-contain object-center"
              src={secretQrCode}
              alt="QR code"
            />
          </div>
        )}
        {!isQrCodeFormat && (
          <div className="w-full m-4">
            <div className="p-4 w-full text-center font-mono text-base font-semibold tracking-[0.08em] rounded-[13px] bg-surface border border-line-strong text-ink mb-3 break-all">
              {secret}
            </div>
            <Button
              title="action.copy"
              type="secondary"
              onClick={() => {
                void copyText(secret, t('mfa.secret_key_copied'));
              }}
            />
          </div>
        )}
        <TextLink
          text={isQrCodeFormat ? 'mfa.qr_code_not_available' : 'mfa.want_to_scan_qr_code'}
          onClick={() => {
            setIsQrCodeFormat(!isQrCodeFormat);
          }}
        />
      </div>
    </SectionLayout>
  );
};

export default SecretSection;
