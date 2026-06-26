import classNames from 'classnames';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PasswordInputField } from '@/components/InputFields';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import StrengthMeter from '@/shared/components/InputFields/PasswordInputField/StrengthMeter';

import HiddenIdentifierInput from './HiddenIdentifierInput';

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
};

const Lite = ({ className, autoFocus, onSubmit, errorMessage, clearErrorMessage }: Props) => {
  const { t } = useTranslation();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FieldState>({
    reValidateMode: 'onBlur',
    defaultValues: { newPassword: '' },
  });

  const newPasswordValue = watch('newPassword');

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
      <PasswordInputField
        className="mb-4"
        autoComplete="new-password"
        label={t('input.password')}
        autoFocus={autoFocus}
        isDanger={!!errors.newPassword}
        errorMessage={errors.newPassword?.message}
        aria-invalid={!!errors.newPassword}
        {...register('newPassword', {
          required: t('error.password_required'),
        })}
      />

      {newPasswordValue.length > 0 && (
        <StrengthMeter className="-mt-3 mb-4" password={newPasswordValue} />
      )}

      {errorMessage && <ErrorMessage className="mb-4 ms-0.5 -mt-3">{errorMessage}</ErrorMessage>}

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

export default Lite;
