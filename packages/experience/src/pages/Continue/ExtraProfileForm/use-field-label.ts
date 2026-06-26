import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { extraProfileFieldNamesGuard } from '@/types/guard';

const useFieldLabel = () => {
  const { t } = useTranslation();

  const getFieldLabel = useCallback(
    (fieldName: string, label = '') => {
      try {
        const parsedFieldName = extraProfileFieldNamesGuard.parse(fieldName);
        return label || t(`profile.${parsedFieldName}`);
      } catch {
        return label;
      }
    },
    [t]
  );

  return getFieldLabel;
};

export default useFieldLabel;
