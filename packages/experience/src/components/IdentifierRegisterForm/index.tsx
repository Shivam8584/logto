import { LockClosedIcon } from '@heroicons/react/24/outline';
import { AgreeToTermsPolicy, type SignInIdentifier } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback, useContext, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import UserInteractionContext from '@/Providers/UserInteractionContextProvider/UserInteractionContext';
import { SmartInputField } from '@/components/InputFields';
import CaptchaBox from '@/containers/CaptchaBox';
import TermsAndPrivacyCheckbox from '@/containers/TermsAndPrivacyCheckbox';
import usePrefilledIdentifier from '@/hooks/use-prefilled-identifier';
import { useUsernamePolicyDescription } from '@/hooks/use-sie';
import useSingleSignOnWatch from '@/hooks/use-single-sign-on-watch';
import useTerms from '@/hooks/use-terms';
import Button from '@/shared/components/Button';
import ErrorMessage from '@/shared/components/ErrorMessage';
import type { IdentifierInputValue } from '@/shared/components/InputFields/SmartInputField';
import { isUsernamePolicyViolation } from '@/shared/utils/validate-username';
import { getGeneralIdentifierErrorMessage, validateIdentifierField } from '@/utils/form';

import useOnSubmit from './use-on-submit';

type Props = {
  readonly className?: string;
  // eslint-disable-next-line react/boolean-prop-naming
  readonly autoFocus?: boolean;
  readonly signUpMethods: SignInIdentifier[];
};

type FormState = {
  identifier: IdentifierInputValue;
};

const IdentifierRegisterForm = ({ className, autoFocus, signUpMethods }: Props) => {
  const { t } = useTranslation();
  const { termsValidation, agreeToTermsPolicy } = useTerms();

  const { errorMessage, clearErrorMessage, onSubmit } = useOnSubmit();

  const { setIdentifierInputValue } = useContext(UserInteractionContext);
  const { experienceSettings } = useContext(PageContext);
  const prefilledIdentifier = usePrefilledIdentifier({ enabledIdentifiers: signUpMethods });
  const usernamePolicyDescription = useUsernamePolicyDescription();

  const {
    watch,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    control,
  } = useForm<FormState>({
    reValidateMode: 'onBlur',
    defaultValues: { identifier: prefilledIdentifier },
  });

  // Watch identifier field and check single sign on method availability
  const { showSingleSignOnForm, navigateToSingleSignOn } = useSingleSignOnWatch(
    watch('identifier')
  );

  useEffect(() => {
    if (!isValid) {
      clearErrorMessage();
    }
  }, [clearErrorMessage, isValid]);

  const onSubmitHandler = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      clearErrorMessage();

      void handleSubmit(async ({ identifier: { type, value } }) => {
        if (!type) {
          return;
        }

        setIdentifierInputValue({ type, value });

        if (
          agreeToTermsPolicy &&
          agreeToTermsPolicy !== AgreeToTermsPolicy.Automatic &&
          !(await termsValidation())
        ) {
          return;
        }

        if (showSingleSignOnForm) {
          await navigateToSingleSignOn();
          return;
        }

        await onSubmit(type, value);
      })(event);
    },
    [
      agreeToTermsPolicy,
      clearErrorMessage,
      handleSubmit,
      navigateToSingleSignOn,
      onSubmit,
      setIdentifierInputValue,
      showSingleSignOnForm,
      termsValidation,
    ]
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
          validate: ({ type, value }) => {
            if (!type || !value) {
              return getGeneralIdentifierErrorMessage(signUpMethods, 'required');
            }

            const errorMessage = validateIdentifierField(
              type,
              value,
              experienceSettings?.usernamePolicy
            );

            if (errorMessage) {
              /**
               * This page shows no upfront policy description (the smart input may hold any
               * identifier type), so a policy violation surfaces the full requirements sentence
               * instead of the specific violation. Hard-floor violations stay specific — the
               * requirements sentence does not describe them.
               */
              if (usernamePolicyDescription && isUsernamePolicyViolation(errorMessage)) {
                return usernamePolicyDescription;
              }

              return typeof errorMessage === 'string'
                ? t(`error.${errorMessage}`)
                : t(`error.${errorMessage.code}`, errorMessage.data ?? {});
            }

            return true;
          },
        }}
        render={({ field, formState: { defaultValues } }) => (
          <SmartInputField
            autoFocus={autoFocus}
            className="mb-4"
            {...field}
            defaultValue={defaultValues?.identifier?.value}
            isDanger={!!errors.identifier || !!errorMessage}
            errorMessage={errors.identifier?.message}
            enabledTypes={signUpMethods}
          />
        )}
      />
      {errorMessage && <ErrorMessage className="mb-4 ms-0.5 mt-0">{errorMessage}</ErrorMessage>}
      {showSingleSignOnForm && (
        <div className="mb-4 text-sm text-muted">{t('description.single_sign_on_enabled')}</div>
      )}
      {/**
       * Have to use css to hide the terms element.
       * Remove element from dom will trigger a form re-render.
       * Form rerender will trigger autofill.
       * If the autofill value is SSO enabled, it will always show SSO form.
       */}
      <TermsAndPrivacyCheckbox
        className={classNames(
          'mb-4',
          /**
           * Hide the terms checkbox when the policy is set to `Automatic`.
           * In registration, the terms checkbox is always shown for `Manual` and `ManualRegistrationOnly` policies.
           */
          agreeToTermsPolicy === AgreeToTermsPolicy.Automatic && 'hidden'
        )}
      />
      <CaptchaBox />
      <Button
        name="submit"
        title={showSingleSignOnForm ? 'action.single_sign_on' : 'action.create_account'}
        icon={showSingleSignOnForm ? <LockClosedIcon className="w-5 h-5" /> : undefined}
        htmlType="submit"
        isLoading={isSubmitting}
      />
      <input hidden type="submit" />
    </form>
  );
};

export default IdentifierRegisterForm;
