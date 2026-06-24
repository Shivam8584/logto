import { MfaFactor } from '@logto/schemas';
import { t } from 'i18next';
import { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import useSendMfaPayload from '@/hooks/use-send-mfa-payload';
import useTextHandler from '@/hooks/use-text-handler';
import ErrorPage from '@/pages/ErrorPage';
import Button from '@/shared/components/Button';
import DynamicT from '@/shared/components/DynamicT';
import { UserMfaFlow } from '@/types';
import { backupCodeBindingStateGuard } from '@/types/guard';
import { isNativeWebview } from '@/utils/native-sdk';

const BackupCodeBinding = () => {
  const { copyText, downloadText } = useTextHandler();
  const sendMfaPayload = useSendMfaPayload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verificationIdsMap } = useContext(UserInteractionContext);
  const verificationId = verificationIdsMap[MfaFactor.BackupCode];

  const { state } = useLocation();
  const { data: backupCodeBindingState } = backupCodeBindingStateGuard.safeParse(state);

  if (!backupCodeBindingState || !verificationId) {
    return <ErrorPage title="error.invalid_session" />;
  }

  const { codes } = backupCodeBindingState;
  const backupCodeTextContent = codes.join('\n');

  return (
    <SecondaryPageLayout
      isNavBarHidden
      title="mfa.save_backup_code"
      description="mfa.save_backup_code_description"
    >
      <div className="flex flex-col justify-center items-stretch gap-4 pb-6">
        <div className="grid grid-cols-2 p-4 text-sm font-medium text-center rounded-[13px] bg-surface-2 text-ink gap-y-2 mobile:text-base font-mono tracking-[0.02em] [font-variant-numeric:tabular-nums]">
          {codes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {!isNativeWebview() && (
            <Button
              title="action.download"
              type="secondary"
              onClick={() => {
                downloadText(backupCodeTextContent, 'backup_code.txt');
              }}
            />
          )}
          <Button
            title="action.copy"
            type="secondary"
            onClick={() => {
              void copyText(backupCodeTextContent, t('mfa.backup_code_copied'));
            }}
          />
        </div>
        <div className="text-sm text-muted">
          <DynamicT forKey="mfa.backup_code_hint" />
        </div>
        <Button
          title="action.continue"
          isLoading={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            await sendMfaPayload({
              flow: UserMfaFlow.MfaBinding,
              payload: { type: MfaFactor.BackupCode },
              verificationId,
            });
            setIsSubmitting(false);
          }}
        />
      </div>
    </SecondaryPageLayout>
  );
};

export default BackupCodeBinding;
