import { type SignInIdentifier } from '@logto/schemas';
import { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import TextLink from '@/components/TextLink';
import Button from '@/shared/components/Button';
import VerificationCodeInput from '@/shared/components/VerificationCode';

import useMfaCodeVerification from './use-mfa-code-verification';
import useResendMfaVerificationCode from './use-resend-mfa-verification-code';

const codeLength = 6;

const isCodeReady = (code: string[]) => {
  return code.length === codeLength && code.every(Boolean);
};

type Props = {
  readonly identifierType: SignInIdentifier.Email | SignInIdentifier.Phone;
  readonly verificationId: string;
};

const MfaCodeVerification = ({ identifierType, verificationId }: Props) => {
  const { t } = useTranslation();
  const [codeInput, setCodeInput] = useState<string[]>([]);
  const [inputErrorMessage, setInputErrorMessage] = useState<string>();
  const [currentVerificationId, setCurrentVerificationId] = useState(verificationId);

  useEffect(() => {
    setCurrentVerificationId(verificationId);
  }, [verificationId]);

  const errorCallback = useCallback(() => {
    setCodeInput([]);
    setInputErrorMessage(undefined);
  }, []);

  const { errorMessage: submitErrorMessage, onSubmit } = useMfaCodeVerification(
    identifierType,
    currentVerificationId,
    errorCallback
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const errorMessage = inputErrorMessage ?? submitErrorMessage;

  const { seconds, isRunning, onResendVerificationCode } =
    useResendMfaVerificationCode(identifierType);

  const handleSubmit = useCallback(
    async (code: string[]) => {
      if (isSubmitting) {
        return;
      }

      setInputErrorMessage(undefined);
      setIsSubmitting(true);

      try {
        await onSubmit(code.join(''));
      } finally {
        // Always reset, even if `onSubmit` throws, so the button never sticks.
        setIsSubmitting(false);
      }
    },
    [onSubmit, isSubmitting]
  );

  return (
    <>
      <VerificationCodeInput
        name="mfaCode"
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
      <div className="mt-3 text-sm text-muted">
        {isRunning ? (
          <Trans components={{ span: <span key="counter" /> }}>
            {t('description.resend_after_seconds', { seconds })}
          </Trans>
        ) : (
          <Trans
            components={{
              a: (
                <TextLink
                  className="cursor-pointer"
                  onClick={async () => {
                    // Guard against a burst of clicks during the in-flight resend: the
                    // countdown only restarts AFTER the API resolves, so without this the
                    // link stays clickable and each call invalidates the previous code.
                    if (isResending) {
                      return;
                    }

                    setInputErrorMessage(undefined);
                    setCodeInput([]);
                    setIsResending(true);
                    try {
                      const newId = await onResendVerificationCode();
                      if (newId) {
                        setCurrentVerificationId(newId);
                      }
                    } finally {
                      setIsResending(false);
                    }
                  }}
                />
              ),
            }}
          >
            {t('description.resend_passcode')}
          </Trans>
        )}
      </div>
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

export default MfaCodeVerification;
