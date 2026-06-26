import classNames from 'classnames';
import { useCallback, useContext, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import { SmartInputField } from '@/components/InputFields';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import type {
  IdentifierInputType,
  IdentifierInputValue,
} from '@/shared/components/InputFields/SmartInputField';
import { getGeneralIdentifierErrorMessage, validateIdentifierField } from '@/utils/form';

type Props = {
  readonly className?: string;
  // eslint-disable-next-line react/boolean-prop-naming
  readonly autoFocus?: boolean;
  readonly defaultType?: IdentifierInputType;
  readonly enabledTypes: IdentifierInputType[];

  readonly onSubmit?: (identifier: IdentifierInputType, value: string) => Promise<void> | void;
  readonly errorMessage?: string;
  readonly clearErrorMessage?: () => void;
};

type FormState = {
  identifier: IdentifierInputValue;
};

const IdentifierProfileForm = ({
  className,
  autoFocus,
  defaultType,
  enabledTypes,
  onSubmit,
  errorMessage,
  clearErrorMessage,
}: Props) => {
  const { t } = useTranslation();
  const { experienceSettings } = useContext(PageContext);
  const {
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormState>({
    reValidateMode: 'onBlur',
    defaultValues: {
      identifier: {
        type: defaultType,
        value: '',
      },
    },
  });

  useEffect(() => {
    if (!isValid) {
      clearErrorMessage?.();
    }
  }, [clearErrorMessage, isValid]);

  const onSubmitHandler = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      clearErrorMessage?.();

      await handleSubmit(async ({ identifier: { type, value } }) => {
        if (!type) {
          return;
        }

        await onSubmit?.(type, value);
      })(event);
    },
    [clearErrorMessage, handleSubmit, onSubmit]
  );

  return (
    <form
      className={classNames('flex flex-col items-center justify-center [&>*]:w-full', className)}
      onSubmit={onSubmitHandler}
    >
      <Controller
        control={control}
        name="identifier"
        rules={{
          validate: (identifier) => {
            const { type, value } = identifier;

            if (!type || !value) {
              return getGeneralIdentifierErrorMessage(enabledTypes, 'required');
            }

            const errorMessage = validateIdentifierField(
              type,
              value,
              experienceSettings?.usernamePolicy
            );

            if (errorMessage) {
              return typeof errorMessage === 'string'
                ? t(`error.${errorMessage}`)
                : t(`error.${errorMessage.code}`, errorMessage.data ?? {});
            }

            return true;
          },
        }}
        render={({ field }) => (
          // No autoComplete="off" here: this is the "add your email / phone" profile step,
          // where the browser SHOULD offer the user's email/phone. SmartInputField computes
          // the correct token (email / tel) from enabledTypes via getInputHtmlProps.
          <SmartInputField
            autoFocus={autoFocus}
            className="mb-4"
            {...field}
            isDanger={!!errors.identifier || !!errorMessage}
            errorMessage={errors.identifier?.message}
            enabledTypes={enabledTypes}
          />
        )}
      />

      {errorMessage && <ErrorMessage className="mb-4 ms-0.5 -mt-3">{errorMessage}</ErrorMessage>}

      <Button title="action.continue" htmlType="submit" isLoading={isSubmitting} />

      <input hidden type="submit" />
    </form>
  );
};

export default IdentifierProfileForm;
