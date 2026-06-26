import { PhoneNumberParser } from '@logto/shared/universal';
import i18next from 'i18next';
import type { CountryCode, CountryCallingCode } from 'libphonenumber-js/mobile';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/mobile';

// India-first fallback: when the browser locale carries no region (e.g. plain "en"),
// the previous "US" fallback made every phone field default to +1. Our audience is
// India-first, so default to IN; locale region (en-IN / en-US) still wins when present,
// and IP geolocation (detectCountryByIp) upgrades this at runtime when available.
export const fallbackCountryCode = 'IN';

export const countryCallingCodeMap: Record<string, CountryCode> = {
  zh: 'CN',
  en: 'IN',
  ja: 'JP',
  ko: 'KR',
};

/**
 * Best-effort default country from the user's IP, via country.is — a free, keyless,
 * open-source endpoint (https://country.is) returning `{ country: "IN" }`. Used only to
 * UPGRADE the locale-derived default; any failure/timeout silently keeps the locale
 * default, so this never blocks or breaks the form. Resolves to a valid CountryCode or
 * undefined.
 */
export const detectCountryByIp = async (): Promise<CountryCode | undefined> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 1500);
    const response = await fetch('https://api.country.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return undefined;
    }
    const { country }: { country?: string } = await response.json();
    return country && isValidCountryCode(country) ? country : undefined;
  } catch {
    return undefined;
  }
};

export const isValidCountryCode = (countryCode: string): countryCode is CountryCode => {
  try {
    // Use getCountryCallingCode method to guard the input's value is in CountryCode union type, if type not match exceptions are expected
    // eslint-disable-next-line no-restricted-syntax
    getCountryCallingCode(countryCode as CountryCode);

    return true;
  } catch {
    return false;
  }
};

export const getDefaultCountryCode = (): CountryCode => {
  const { language } = i18next;

  // Extract the country code from language tag suffix
  const [languageCode, countryCode] = language.split('-');

  if (countryCode && isValidCountryCode(countryCode)) {
    return countryCode;
  }

  const upperCaseLanguageCode = languageCode?.toUpperCase();

  if (upperCaseLanguageCode && isValidCountryCode(upperCaseLanguageCode)) {
    return upperCaseLanguageCode;
  }

  return countryCallingCodeMap[language] ?? fallbackCountryCode;
};

export const getDefaultCountryCallingCode = () => getCountryCallingCode(getDefaultCountryCode());

/**
 * Resolve an ISO country (e.g. "IN") from a bare calling code (e.g. "91"), so the
 * selector trigger can render the matching flag. Several countries can share a calling
 * code (e.g. +1 → US/CA/…); we prefer the locale's default country when it matches, then
 * fall back to the first country libphonenumber lists for that code. Returns undefined
 * when no country uses the code (so callers can skip the flag gracefully).
 */
export const getCountryByCallingCode = (callingCode: string): CountryCode | undefined => {
  const normalized = callingCode.replace(/^\+/, '');

  const defaultCountryCode = getDefaultCountryCode();
  if (getCountryCallingCode(defaultCountryCode) === normalized) {
    return defaultCountryCode;
  }

  return getCountries().find((code) => getCountryCallingCode(code) === normalized);
};

/**
 * Resolve the human-readable, localized country name for a country code using the
 * platform `Intl.DisplayNames` API (built into every modern browser, no extra deps,
 * automatically translated to the active locale). Falls back to the raw code if the
 * API is unavailable or the region is unknown.
 */
export const getCountryName = (countryCode: CountryCode): string => {
  try {
    const displayNames = new Intl.DisplayNames([i18next.language], { type: 'region' });

    return displayNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
};

/**
 * Provide Country Code Options
 */
export type CountryMetaData = {
  countryCode: CountryCode;
  countryCallingCode: CountryCallingCode;
  /** Localized, human-readable country name (e.g. "India"). */
  countryName: string;
};

const buildCountryMetaData = (countryCode: CountryCode): CountryMetaData => ({
  countryCode,
  countryCallingCode: getCountryCallingCode(countryCode),
  countryName: getCountryName(countryCode),
});

/**
 * NANP micro-territories that share +1 with the US/Canada. libphonenumber lists all 25
 * of them, so the picker showed "+1" ~25 times (US, Canada, then 23 tiny Caribbean/
 * Pacific territories) — the repetition the user flagged. These have a negligible
 * sign-up base for this product, so we hide them; US and CA (the only +1 regions real
 * users pick) stay. Anyone in a hidden territory can still type their full +1 number.
 */
const hiddenSharedCodeRegions = new Set<CountryCode>([
  'AG',
  'AI',
  'AS',
  'BB',
  'BM',
  'BS',
  'DM',
  'DO',
  'GD',
  'GU',
  'JM',
  'KN',
  'KY',
  'LC',
  'MP',
  'MS',
  'PR',
  'SX',
  'TC',
  'TT',
  'VC',
  'VG',
  'VI',
]);

export const getCountryList = (): CountryMetaData[] => {
  const defaultCountryCode = getDefaultCountryCode();

  const countryList = getCountries()
    .filter((code) => code !== defaultCountryCode && !hiddenSharedCodeRegions.has(code))
    .map((code) => buildCountryMetaData(code))
    // Sort alphabetically by localized country name so the list reads naturally.
    .slice()
    .sort((previous, next) =>
      previous.countryName.localeCompare(next.countryName, i18next.language)
    );

  // Pin the detected/default country to the top for quick access.
  return [buildCountryMetaData(defaultCountryCode), ...countryList];
};

export const formatPhoneNumberWithCountryCallingCode = (number: string) => {
  try {
    const phoneNumber = PhoneNumberParser.parse(number);

    return `+${phoneNumber.countryCallingCode} ${phoneNumber.nationalNumber}`;
  } catch {
    return number;
  }
};

export const parsePhoneNumber = (value: string) => {
  try {
    const phoneNumber = PhoneNumberParser.parse(value);

    return {
      countryCallingCode: phoneNumber.countryCallingCode,
      nationalNumber: phoneNumber.nationalNumber,
    };
  } catch {}
};
