import { XCircleIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { InputField } from '@/components/InputFields';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import IconButton from '@/shared/components/IconButton';
import StrengthMeter from '@/shared/components/InputFields/PasswordInputField/StrengthMeter';

import HiddenIdentifierInput from './HiddenIdentifierInput';
import TogglePassword from './TogglePassword';

type Props = {
  readonly className?: string;
  // eslint-disable-next-line react/boolean-prop-naming
  readonly autoFocus?: boolean;
  readonly onSubmit: (password: string) => Promise<void>;
  readonly errorMessage?: string;
  readonly clearErrorMessage?: () => void;
};

type FieldState = {
  newPassword: string;
  confirmPassword: string;
};

const SetPassword = ({
  className,
  autoFocus,
  onSubmit,
  errorMessage,
  clearErrorMessage,
}: Props) => {
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const detectCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(event.getModifierState('CapsLock'));
  };

  const {
    register,
    watch,
    resetField,
    trigger,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FieldState>({
    reValidateMode: 'onBlur',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // Compose the registered field's onBlur (used by RHF's onBlur revalidation) with the
  // Caps Lock reset so neither behaviour is lost.
  const registerWithCapsLock = (
    field: keyof FieldState,
    options?: Parameters<typeof register>[1]
  ) => {
    const { onBlur, ...rest } = register(field, options);

    return {
      ...rest,
      onKeyUp: detectCapsLock,
      onKeyDown: detectCapsLock,
      onBlur: async (event: React.FocusEvent<HTMLInputElement>) => {
        setIsCapsLockOn(false);
        await onBlur(event);
      },
    };
  };

  useEffect(() => {
    if (!isValid) {
      clearErrorMessage?.();
    }
  }, [clearErrorMessage, isValid]);

  const onSubmitHandler = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      clearErrorMessage?.();

      await handleSubmit(async (data) => {
        await onSubmit(data.newPassword);
      })(event);
    },
    [clearErrorMessage, handleSubmit, onSubmit]
  );

  return (
    <form
      className={classNames('flex flex-col items-center justify-center [&>*]:w-full', className)}
      onSubmit={onSubmitHandler}
    >
      <HiddenIdentifierInput />
      <InputField
        className="mb-4"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        label={t('input.password')}
        autoFocus={autoFocus}
        isDanger={!!errors.newPassword}
        errorMessage={errors.newPassword?.message}
        aria-invalid={!!errors.newPassword}
        {...registerWithCapsLock('newPassword', {
          required: t('error.password_required'),
        })}
        isSuffixFocusVisible={!!watch('newPassword')}
        suffix={
          <IconButton
            onClick={() => {
              resetField('newPassword');
            }}
          >
            <XCircleIcon className="w-5 h-5" />
          </IconButton>
        }
      />

      {isCapsLockOn && (
        <div className="text-sm text-amber ms-0.5 -mt-3 mb-4" role="status" aria-live="polite">
          {t('input.caps_lock_on')}
        </div>
      )}

      {!!watch('newPassword') && (
        <StrengthMeter className="-mt-3 mb-4" password={watch('newPassword')} />
      )}

      <InputField
        className="mb-4"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        label={t('input.confirm_password')}
        errorMessage={errors.confirmPassword?.message}
        aria-invalid={!!errors.confirmPassword}
        {...registerWithCapsLock('confirmPassword', {
          validate: (value) => value === watch('newPassword') || t('error.passwords_do_not_match'),
          // Live match feedback: revalidate as the user types the confirmation, so a mismatch
          // is shown (and cleared) immediately instead of only on blur/submit.
          onChange: () => {
            void trigger('confirmPassword');
          },
        })}
        isSuffixFocusVisible={!!watch('confirmPassword')}
        suffix={
          <IconButton
            onClick={() => {
              resetField('confirmPassword');
            }}
          >
            <XCircleIcon className="w-5 h-5" />
          </IconButton>
        }
      />

      {errorMessage && <ErrorMessage className="mb-4 ms-0.5 -mt-3">{errorMessage}</ErrorMessage>}

      <TogglePassword isChecked={showPassword} onChange={setShowPassword} />

      <Button
        name="submit"
        title="action.save_password"
        htmlType="submit"
        isLoading={isSubmitting}
      />

      <input hidden type="submit" />
    </form>
  );
};

export default SetPassword;
