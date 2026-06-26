import { LockClosedIcon } from '@heroicons/react/24/outline';
import { AgreeToTermsPolicy, SignInIdentifier } from '@logto/schemas';
import { useCallback, useContext, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import TermsAndPrivacyCheckbox from '@/containers/TermsAndPrivacyCheckbox';
import useOnSubmit from '@/hooks/use-check-single-sign-on';
import useTerms from '@/hooks/use-terms';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import SmartInputField, {
  type IdentifierInputValue,
} from '@/shared/components/InputFields/SmartInputField';
import { getGeneralIdentifierErrorMessage, validateIdentifierField } from '@/utils/form';

type FormState = {
  identifier: IdentifierInputValue;
};

type Props = {
  readonly isTermsAndPrivacyCheckboxVisible?: boolean;
};

const SingleSignOnForm = ({ isTermsAndPrivacyCheckboxVisible }: Props) => {
  const { errorMessage, clearErrorMessage, onSubmit } = useOnSubmit();
  const { ssoEmail } = useContext(UserInteractionContext);
  const { termsValidation, agreeToTermsPolicy } = useTerms();

  const {
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormState>({
    reValidateMode: 'onBlur',
    defaultValues: {
      identifier: {
        value: ssoEmail,
      },
    },
  });

  useEffect(() => {
    if (!isValid) {
      clearErrorMessage();
    }
  }, [clearErrorMessage, isValid]);

  const onSubmitHandler = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      /**
       * Prevent the default form submission behavior to avoid page reload.
       */
      event?.preventDefault();

      /**
       * Check if the user has agreed to the terms and privacy policy when the policy is set to `Manual`.
       */
      if (agreeToTermsPolicy === AgreeToTermsPolicy.Manual && !(await termsValidation())) {
        return;
      }

      clearErrorMessage();

      await handleSubmit(async ({ identifier: { value } }) => onSubmit(value, true))(event);
    },
    [agreeToTermsPolicy, clearErrorMessage, handleSubmit, onSubmit, termsValidation]
  );

  return (
    <form
      className="flex flex-col items-center justify-center [&>*]:w-full"
      onSubmit={onSubmitHandler}
    >
      <Controller
        control={control}
        name="identifier"
        rules={{
          validate: ({ value }) => {
            if (!value) {
              return getGeneralIdentifierErrorMessage([SignInIdentifier.Email], 'required');
            }

            const errorMessage = validateIdentifierField(SignInIdentifier.Email, value);

            return errorMessage
              ? getGeneralIdentifierErrorMessage([SignInIdentifier.Email], 'invalid')
              : true;
          },
        }}
        render={({ field, formState: { defaultValues } }) => (
          <SmartInputField
            autoFocus
            className="mb-4"
            {...field}
            isDanger={!!errors.identifier}
            defaultValue={defaultValues?.identifier?.value}
            errorMessage={errors.identifier?.message}
            enabledTypes={[SignInIdentifier.Email]}
          />
        )}
      />

      {errorMessage && <ErrorMessage className="mb-4 ms-0.5">{errorMessage}</ErrorMessage>}

      {Boolean(isTermsAndPrivacyCheckboxVisible) && <TermsAndPrivacyCheckbox className="mb-4" />}

      <Button
        title="action.single_sign_on"
        htmlType="submit"
        icon={<LockClosedIcon className="w-5 h-5" />}
        isLoading={isSubmitting}
      />

      <input hidden type="submit" />
    </form>
  );
};

export default SingleSignOnForm;
