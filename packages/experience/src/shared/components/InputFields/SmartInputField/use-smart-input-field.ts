import { SignInIdentifier } from '@logto/schemas';
import { getCountryCallingCode } from 'libphonenumber-js/mobile';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ChangeEventHandler } from 'react';

import { getDefaultCountryCallingCode, detectCountryByIp } from '@/utils/country-code';
import { parseIdentifierValue } from '@/utils/form';

import { detectIdentifierType } from './utils';

export type IdentifierInputType =
  | SignInIdentifier.Email
  | SignInIdentifier.Phone
  | SignInIdentifier.Username;

export type IdentifierInputValue = {
  /**
   * The type of the identifier input.
   * `undefined` value is for the case when the user has inputted an identifier but the type is not yet determined in the `SmartInputField`.
   */
  type?: IdentifierInputType;
  /**
   * The value of the identifier input.
   */
  value: string;
};

type Props = {
  defaultValue?: string;
  enabledTypes: IdentifierInputType[];
};

const useSmartInputField = ({ defaultValue, enabledTypes }: Props) => {
  const enabledTypeSet = useMemo(() => new Set(enabledTypes), [enabledTypes]);

  // Parse default type from enabled types and default value
  const defaultType = useMemo(
    () => detectIdentifierType({ value: defaultValue ?? '', enabledTypeSet }),
    [defaultValue, enabledTypeSet]
  );

  // Parse default value if provided
  const { countryCode: defaultCountryCode, inputValue: defaultInputValue } = useMemo(
    () => parseIdentifierValue(defaultType, defaultValue),
    [defaultType, defaultValue]
  );

  const [currentType, setCurrentType] = useState(defaultType);

  const [countryCode, setCountryCode] = useState<string>(
    defaultCountryCode ?? getDefaultCountryCallingCode()
  );

  // Upgrade the default country from IP geolocation once on mount — but never override a
  // value the user (or a prefilled identifier) already set. country.is is best-effort:
  // on failure the locale-derived default stands.
  const userTouchedCountry = useRef(Boolean(defaultCountryCode));
  const cancelled = useRef(false);
  useEffect(() => {
    const upgradeFromIp = async () => {
      const detected = await detectCountryByIp();
      if (cancelled.current || !detected || userTouchedCountry.current) {
        return;
      }
      try {
        setCountryCode(getCountryCallingCode(detected));
      } catch {
        // Ignore — keep the existing default
      }
    };
    void upgradeFromIp();
    return () => {
      // eslint-disable-next-line @silverhand/fp/no-mutation
      cancelled.current = true;
    };
  }, []);

  const [inputValue, setInputValue] = useState<string>(defaultInputValue ?? '');

  const detectInputType = useCallback(
    (value: string) => detectIdentifierType({ value, enabledTypeSet, currentType }),
    [currentType, enabledTypeSet]
  );

  const onCountryCodeChange = useCallback(
    (value: string) => {
      if (currentType === SignInIdentifier.Phone) {
        const code = value.replace(/\D/g, '');
        // The user picked a country explicitly — don't let the async IP detection
        // override it afterwards.
        // eslint-disable-next-line @silverhand/fp/no-mutation
        userTouchedCountry.current = true;
        setCountryCode(code);
      }
    },
    [currentType]
  );

  const onInputValueChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ target: { value } }) => {
      const trimValue = value.trim();
      setInputValue(trimValue);

      const type = detectInputType(trimValue);
      setCurrentType(type);
    },
    [detectInputType]
  );

  const onInputValueClear = useCallback(() => {
    setInputValue('');
    setCurrentType(enabledTypeSet.size === 1 ? defaultType : undefined);
  }, [defaultType, enabledTypeSet.size]);

  return {
    countryCode,
    onCountryCodeChange,
    inputValue,
    onInputValueChange,
    onInputValueClear,
    identifierType: currentType,
  };
};

export default useSmartInputField;
