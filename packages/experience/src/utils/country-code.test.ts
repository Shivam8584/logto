import i18next from 'i18next';

import {
  isValidCountryCode,
  getDefaultCountryCode,
  getDefaultCountryCallingCode,
  getCountryList,
  formatPhoneNumberWithCountryCallingCode,
} from './country-code';

describe('country-code', () => {
  void i18next.init();

  it('isValidCountryCode', () => {
    expect(isValidCountryCode('CN')).toBeTruthy();
    expect(isValidCountryCode('xy')).toBeFalsy();
  });

  it('getDefaultCountryCode', async () => {
    await i18next.changeLanguage('zh');

    expect(getDefaultCountryCode()).toEqual('CN');

    // Hypedrive is India-first: bare `en` maps to IN (a region-qualified locale like
    // en-US / en-CA below still wins when present).
    await i18next.changeLanguage('en');
    expect(getDefaultCountryCode()).toEqual('IN');

    await i18next.changeLanguage('zh-CN');
    expect(getDefaultCountryCode()).toEqual('CN');

    await i18next.changeLanguage('zh-TW');
    expect(getDefaultCountryCode()).toEqual('TW');

    await i18next.changeLanguage('en-US');
    expect(getDefaultCountryCode()).toEqual('US');

    await i18next.changeLanguage('en-CA');
    expect(getDefaultCountryCode()).toEqual('CA');

    await i18next.changeLanguage('ru');
    expect(getDefaultCountryCode()).toEqual('RU');

    await i18next.changeLanguage('ja');
    expect(getDefaultCountryCode()).toEqual('JP');

    await i18next.changeLanguage('ko');
    expect(getDefaultCountryCode()).toEqual('KR');
  });

  it('getDefaultCountryCallingCode', async () => {
    await i18next.changeLanguage('zh');
    expect(getDefaultCountryCallingCode()).toEqual('86');

    // India-first: bare `en` -> IN (+91); region-qualified en-US / en-CA below still win.
    await i18next.changeLanguage('en');
    expect(getDefaultCountryCallingCode()).toEqual('91');

    await i18next.changeLanguage('zh-CN');
    expect(getDefaultCountryCallingCode()).toEqual('86');

    await i18next.changeLanguage('zh-TW');
    expect(getDefaultCountryCallingCode()).toEqual('886');

    await i18next.changeLanguage('en-US');
    expect(getDefaultCountryCallingCode()).toEqual('1');

    await i18next.changeLanguage('en-CA');
    expect(getDefaultCountryCallingCode()).toEqual('1');

    await i18next.changeLanguage('ru');
    expect(getDefaultCountryCallingCode()).toEqual('7');

    await i18next.changeLanguage('ja');
    expect(getDefaultCountryCallingCode()).toEqual('81');

    await i18next.changeLanguage('ko');
    expect(getDefaultCountryCallingCode()).toEqual('82');
  });

  it('getCountryList pins the default country first and includes a localized name', async () => {
    await i18next.changeLanguage('zh');
    const countryList = getCountryList();

    // The detected/default country is pinned to the top for quick access.
    expect(countryList[0]).toMatchObject({
      countryCode: 'CN',
      countryCallingCode: '86',
    });
    // Each entry now carries a localized, human-readable name.
    expect(countryList[0]?.countryName).toBeTruthy();
  });

  it('getCountryList sorts the remaining countries alphabetically by localized name', async () => {
    await i18next.changeLanguage('en');
    const [, ...rest] = getCountryList();

    const names = rest.map(({ countryName }) => countryName);
    const sorted = names.slice().sort((first, second) => first.localeCompare(second, 'en'));

    expect(names).toEqual(sorted);
  });

  it('getCountryList keeps every country sharing a calling code (no dedupe)', async () => {
    await i18next.changeLanguage('en');
    const countryList = getCountryList();

    // Many countries share +1 (US, Canada, Caribbean nations…). They must all remain
    // selectable, distinguished by name and flag — unlike the old dedupe-by-code behavior.
    const plusOne = countryList.filter(({ countryCallingCode }) => countryCallingCode === '1');
    expect(plusOne.length).toBeGreaterThan(1);
    // And they are distinct countries.
    expect(new Set(plusOne.map(({ countryCode }) => countryCode)).size).toEqual(plusOne.length);
  });

  it('formatPhoneNumberWithCountryCallingCode', async () => {
    expect(formatPhoneNumberWithCountryCallingCode('18888888888')).toBe('+1 8888888888');
    expect(formatPhoneNumberWithCountryCallingCode('8618888888888')).toBe('+86 18888888888');
  });
});
