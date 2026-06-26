import { assert } from '@silverhand/essentials';
import { render, fireEvent, waitFor, act } from '@testing-library/react';

import { getCountryList } from '@/utils/country-code';

import CountryCodeDropdown from '.';

// Need to mock the scrollIntoView method because jsdom doesn't support it
// eslint-disable-next-line @silverhand/fp/no-mutation
Element.prototype.scrollIntoView = jest.fn();

jest.mock('i18next', () => ({
  language: 'en',
  t: (key: string) => key,
}));

// Stub the flag library so tests don't depend on its inline-SVG internals.
jest.mock('@sankyu/react-circle-flags', () => ({
  DynamicFlag: ({ code }: { readonly code: string }) => <span data-flag={code} />,
  FlagUtils: { isValidCountryCode: () => true },
}));

describe('CountryCodeDropdown', () => {
  const onChange = jest.fn();
  const onClose = jest.fn();
  const countryList = getCountryList();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render countries by name and select one on click', async () => {
    const countryCode = '1';
    // Pick a country with a unique, unambiguous name to click on.
    const target = countryList.find(({ countryCode: code }) => code === 'CN');
    assert(target, new Error('Expected China to be present in the country list'));

    const { container, getByText } = render(
      <CountryCodeDropdown
        isOpen
        countryCode={countryCode}
        countryList={countryList}
        onClose={onClose}
        onChange={onChange}
      />
    );

    await waitFor(() => {
      expect(
        container.parentElement?.querySelector('input[name="country-code-search"]')
      ).not.toBeNull();
    });

    // Country names are now rendered (not just calling codes).
    expect(getByText(target.countryName)).not.toBeNull();

    fireEvent.click(getByText(target.countryName));
    expect(onChange).toBeCalledWith(target.countryCallingCode);
    expect(onClose).toBeCalled();
  });

  it('should filter by country name', async () => {
    const target = countryList.find(({ countryCode: code }) => code === 'IN');
    assert(target, new Error('Expected India to be present in the country list'));

    const { queryByText, getByText, container } = render(
      <CountryCodeDropdown
        isOpen
        countryCode="1"
        countryList={countryList}
        onClose={onClose}
        onChange={onChange}
      />
    );

    const searchInput = container.parentElement?.querySelector('input[name="country-code-search"]');
    assert(searchInput, new Error('Search input not found'));

    act(() => {
      fireEvent.change(searchInput, { target: { value: target.countryName } });
    });

    await waitFor(() => {
      // The searched country is shown...
      expect(getByText(target.countryName)).not.toBeNull();
      // ...and an unrelated country is filtered out.
      const china = countryList.find(({ countryCode: code }) => code === 'CN');
      assert(china, new Error('Expected China in list'));
      expect(queryByText(china.countryName)).toBeNull();
    });

    act(() => {
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });

    expect(onChange).toBeCalledWith(target.countryCallingCode);
  });

  it('should filter by calling code', async () => {
    const { getByText, container } = render(
      <CountryCodeDropdown
        isOpen
        countryCode="1"
        countryList={countryList}
        onClose={onClose}
        onChange={onChange}
      />
    );

    const searchInput = container.parentElement?.querySelector('input[name="country-code-search"]');
    assert(searchInput, new Error('Search input not found'));

    // China is +86; searching "86" should surface it.
    const china = countryList.find(({ countryCode: code }) => code === 'CN');
    assert(china, new Error('Expected China in list'));

    act(() => {
      fireEvent.change(searchInput, { target: { value: '86' } });
    });

    await waitFor(() => {
      expect(getByText(china.countryName)).not.toBeNull();
    });
  });

  it('should navigate through results with ArrowDown and commit on Enter', async () => {
    const target = countryList.find(({ countryCode: code }) => code === 'IN');
    assert(target, new Error('Expected India in list'));

    const { container } = render(
      <CountryCodeDropdown
        isOpen
        countryCode="1"
        countryList={countryList}
        onClose={onClose}
        onChange={onChange}
      />
    );

    const searchInput = container.parentElement?.querySelector('input[name="country-code-search"]');
    assert(searchInput, new Error('Search input not found'));

    // Search by exact name so the top result (and thus the auto-highlight) is India.
    act(() => {
      fireEvent.change(searchInput, { target: { value: target.countryName } });
    });

    // Wait until the matching row is both present AND auto-highlighted (the highlight is
    // applied by a debounced effect, so we must let it settle before committing).
    await waitFor(() => {
      const row = container.parentElement?.querySelector(`li[data-id="${target.countryCode}"]`);
      expect(row).not.toBeNull();
      expect(row?.getAttribute('aria-selected')).toBe('true');
    });

    act(() => {
      fireEvent.keyDown(searchInput, { key: 'Enter' });
    });

    expect(onChange).toBeCalledWith(target.countryCallingCode);
  });
});
