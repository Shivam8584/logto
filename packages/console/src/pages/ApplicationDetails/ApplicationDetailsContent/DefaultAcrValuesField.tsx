import { CustomClientMetadataKey, LogtoAcrValues } from '@logto/schemas';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField from '@/ds-components/FormField';
import Select from '@/ds-components/Select';

import { type ApplicationForm } from './utils';

/**
 * Picks the minimum authentication level (ACR) every user of the application must satisfy
 * by default. Stored as an OIDC `acr_values` string array, but only a single minimum tier
 * is meaningful — the strongest supported value wins at authorize time — so the UI is a
 * single clearable selector instead of free-text.
 */
function DefaultAcrValuesField() {
  const { control } = useFormContext<ApplicationForm>();
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  return (
    <Controller
      name={`customClientMetadata.${CustomClientMetadataKey.DefaultAcrValues}`}
      control={control}
      defaultValue={[]}
      render={({ field: { onChange, value } }) => (
        <FormField
          title="application_details.default_acr_values"
          tip={t('application_details.default_acr_values_tip')}
        >
          <Select
            isClearable
            value={value?.[0]}
            placeholder={t('application_details.default_acr_values_placeholder')}
            options={[
              {
                value: LogtoAcrValues.Password,
                title: t('application_details.default_acr_values_option_pwd'),
              },
              {
                value: LogtoAcrValues.Mfa,
                title: t('application_details.default_acr_values_option_mfa'),
              },
              {
                value: LogtoAcrValues.PhishingResistant,
                title: t('application_details.default_acr_values_option_phr'),
              },
            ]}
            // Clearing maps back to an empty list so the app falls through to the standard flow.
            onChange={(next) => {
              onChange(next ? [next] : []);
            }}
          />
        </FormField>
      )}
    />
  );
}

export default DefaultAcrValuesField;
