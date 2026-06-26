import type { CustomProfileField, UserProfile } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import PrimitiveProfileInputField from '@/components/InputFields/PrimitiveProfileInputField';
import { addressFieldConfigGuard } from '@/types/guard';

import useFieldLabel from '../use-field-label';
import useValidateField from '../use-validate-field';

type AddressSubFormType = Pick<UserProfile, 'address'>;

type Props = {
  readonly field: CustomProfileField;
};

/**
 * The address data structure in profile is as follows:
 *
 * ```
 * address: {
 *   streetAddress?: string;
 *   locality?: string;
 *   region?: string;
 *   postalCode?: string;
 *   country?: string;
 *   formatted?: string;
 * }
 * ```
 *
 * The `formatted` field can be configured in the `config.parts` and rendered as an input,
 * or be computed from the other fields and stay invisible if not specified.
 */
const AddressSubForm = ({ field }: Props) => {
  const { t } = useTranslation();
  const validateField = useValidateField();
  const getFieldLabel = useFieldLabel();

  const {
    control,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useFormContext<AddressSubFormType>();

  const { description, config } = field;

  const enabledParts = useMemo(() => {
    const parsedConfig = addressFieldConfigGuard.parse(config);
    return parsedConfig.parts.filter(({ enabled }) => enabled);
  }, [config]);

  const values = watch('address');

  const setFormattedValue = useCallback(() => {
    const formatted = enabledParts
      .map(({ name }) => values?.[name])
      .filter(Boolean)
      .join(', ');
    setValue('address.formatted', formatted);
  }, [enabledParts, setValue, values]);

  if (enabledParts.length === 0) {
    return null;
  }

  const hasNonRequiredErrors = Object.entries(errors.address ?? {}).some(
    ([_, error]) => typeof error === 'object' && error.type !== 'required'
  );
  return (
    <div className="grid w-full grid-cols-2 gap-3 max-[580px]:grid-cols-1">
      {enabledParts.map((part) => (
        <Controller
          key={part.name}
          name={`address.${part.name}`}
          control={control}
          rules={{
            required:
              part.required &&
              t('error.general_required', {
                types: [getFieldLabel(`address.${part.name}`, part.label)],
              }),
            validate: (value) => validateField(value, part),
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <PrimitiveProfileInputField
              {...part}
              name={`address.${part.name}`}
              className={classNames(
                'col-span-2 max-[580px]:col-span-1',
                (part.name === 'locality' || part.name === 'region') && 'col-span-1'
              )}
              label={part.label ?? t(`profile.address.${part.name}`)}
              value={value ?? ''}
              isDanger={!!errors.address?.[part.name]}
              required={part.required}
              onBlur={onBlur}
              onChange={(event) => {
                onChange(event);
                if (part.name !== 'formatted') {
                  setFormattedValue();
                }
              }}
            />
          )}
        />
      ))}
      {!enabledParts.some(({ name }) => name === 'formatted') && (
        <input {...register('address.formatted')} hidden />
      )}
      {description && (
        <div className="-mt-2 ms-0.5 col-span-2 text-sm text-muted">{description}</div>
      )}
      {errors.address && (
        <div className="-mt-2 ms-0.5 col-span-2 text-sm text-danger flex flex-col gap-1 [&>p]:m-0">
          {hasNonRequiredErrors ? (
            <>
              {Object.entries(errors.address).map(([errorKey, error]) => (
                <p key={errorKey}>
                  {typeof error === 'object' && 'message' in error ? error.message : String(error)}
                </p>
              ))}
            </>
          ) : (
            <p>{t('error.general_required', { types: [t('profile.address.formatted')] })}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressSubForm;
