import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/shared/components/Button';
import VerificationCodeInput from '@/shared/components/VerificationCode';
import { type UserMfaFlow } from '@/types';

import useTotpCodeVerification from './use-totp-code-verification';

const totpCodeLength = 6;

const isCodeReady = (code: string[]) => {
  return code.length === totpCodeLength && code.every(Boolean);
};

type Props<T extends UserMfaFlow> = T extends UserMfaFlow.MfaBinding
  ? {
      flow: T;
      verificationId: string;
    }
  : {
      flow: T;
    };

const TotpCodeVerification = <T extends UserMfaFlow>(props: Props<T>) => {
  const { t } = useTranslation();

  const [codeInput, setCodeInput] = useState<string[]>([]);
  const [inputErrorMessage, setInputErrorMessage] = useState<string>();

  const errorCallback = useCallback(() => {
    setCodeInput([]);
    setInputErrorMessage(undefined);
  }, []);

  const { errorMessage: submitErrorMessage, onSubmit } = useTotpCodeVerification(errorCallback);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorMessage = inputErrorMessage ?? submitErrorMessage;

  const handleSubmit = useCallback(
    async (code: string[]) => {
      if (isSubmitting) {
        return;
      }

      setInputErrorMessage(undefined);
      setIsSubmitting(true);

      try {
        await onSubmit(code.join(''), props);
      } finally {
        // Always reset, even if `onSubmit` throws, so the button never sticks.
        setIsSubmitting(false);
      }
    },
    [onSubmit, isSubmitting, props]
  );

  return (
    <>
      <VerificationCodeInput
        name="totpCode"
        value={codeInput}
        className="mt-4"
        error={errorMessage}
        onChange={(code) => {
          setCodeInput(code);
          if (isCodeReady(code)) {
            void handleSubmit(code);
          }
        }}
      />
      <Button
        title="action.continue"
        type="primary"
        className="mt-6"
        isLoading={isSubmitting}
        onClick={() => {
          if (!isCodeReady(codeInput)) {
            setInputErrorMessage(t('error.invalid_passcode'));
            return;
          }

          void handleSubmit(codeInput);
        }}
      />
    </>
  );
};

export default TotpCodeVerification;
