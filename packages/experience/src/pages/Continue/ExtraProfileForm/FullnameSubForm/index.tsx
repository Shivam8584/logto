import { type UserProfile, type CustomProfileField } from '@logto/schemas';
import classNames from 'classnames';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PrimitiveProfileInputField from '@/components/InputFields/PrimitiveProfileInputField';
import { fullnameFieldConfigGuard } from '@/types/guard';

import useFieldLabel from '../use-field-label';
import useValidateField from '../use-validate-field';

type FullnameFormType = Pick<UserProfile, 'givenName' | 'middleName' | 'familyName'>;

type Props = {
  readonly field: CustomProfileField;
};

const FullnameSubForm = ({ field }: Props) => {
  const { t } = useTranslation();
  const getFieldLabel = useFieldLabel();
  const validateField = useValidateField();

  const { name, label, description, config } = field;
  const parsedConfig = fullnameFieldConfigGuard.parse(config);

  const {
    control,
    formState: { errors },
  } = useFormContext<FullnameFormType>();

  const enabledParts = useMemo(
    () => parsedConfig.parts.filter(({ enabled }) => enabled),
    [parsedConfig.parts]
  );
  const fullnameErrors = Object.entries(errors).filter(([errorKey]) =>
    enabledParts.some(({ name }) => name === errorKey)
  );
  const hasNonRequiredErrors = fullnameErrors.some(([_, error]) => error.type !== 'required');
  const isVertical = enabledParts.length % 2 === 1;

  return (
    <div className="flex flex-col gap-1">
      <div className={classNames('flex gap-3 max-[580px]:flex-col', isVertical && 'flex-col')}>
        {enabledParts.map((part) => (
          <Controller
            key={part.name}
            name={part.name}
            control={control}
            rules={{
              required:
                part.required &&
                t('error.general_required', { types: [getFieldLabel(part.name, part.label)] }),
              validate: (value) => validateField(value, part),
            }}
            render={({ field: { onBlur, onChange, value } }) => (
              <PrimitiveProfileInputField
                {...part}
                className={classNames(
                  'max-[580px]:flex-none max-[580px]:w-full',
                  isVertical ? 'flex-none w-full' : 'flex-1'
                )}
                name={part.name}
                label={part.label ?? t(`profile.${part.name}`)}
                value={value ?? ''}
                isDanger={!!errors[part.name]}
                required={part.required}
                onBlur={onBlur}
                onChange={onChange}
              />
            )}
          />
        ))}
      </div>
      {description && <div className="text-sm text-muted ms-0.5">{description}</div>}
      {fullnameErrors.length > 0 && (
        <div className="text-sm text-danger ms-0.5 flex flex-col gap-1 [&>p]:m-0">
          {hasNonRequiredErrors ? (
            <>
              {fullnameErrors.map(([errorKey, error]) => (
                <p key={errorKey}>{error.message}</p>
              ))}
            </>
          ) : (
            <p>{t('error.general_required', { types: [getFieldLabel(name, label)] })}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FullnameSubForm;
