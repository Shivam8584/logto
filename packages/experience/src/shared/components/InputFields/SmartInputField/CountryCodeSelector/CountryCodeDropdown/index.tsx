import { CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DynamicFlag, FlagUtils } from '@sankyu/react-circle-flags';
import { conditional } from '@silverhand/essentials';
import classNames from 'classnames';
import type { KeyboardEventHandler } from 'react';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactModal from 'react-modal';

import useDebounce from '@/hooks/use-debounce';
import usePlatform from '@/hooks/use-platform';
import InputField from '@/shared/components/InputFields/InputField';
import NavBar from '@/shared/components/NavBar';
import { onKeyDownHandler } from '@/shared/utils/a11y';
import type { CountryMetaData } from '@/utils/country-code';

type Props = {
  readonly isOpen: boolean;
  readonly countryCode: string;
  readonly countryList: CountryMetaData[];
  readonly inputRef?: React.RefObject<HTMLInputElement | undefined>;
  readonly onClose: () => void;
  readonly onChange?: (value: string) => void;
};

// The max height of the dropdown content
const MAX_DROPDOWN_HEIGHT = 480;

const CountryCodeDropdown = ({
  isOpen,
  countryCode,
  countryList,
  inputRef,
  onClose,
  onChange,
}: Props) => {
  const { isMobile } = usePlatform();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [position, setPosition] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, 100);

  const onSearchChange = useCallback(({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(target.value);
  }, []);

  const onDestroy = useCallback(() => {
    setSearchValue('');
    onClose();
  }, [onClose]);

  const onCodeChange = useCallback(
    (value: string) => {
      onChange?.(value);
      onDestroy();
    },
    [onChange, onDestroy]
  );

  const updatePosition = useCallback(() => {
    const parent = inputRef?.current?.parentElement;
    const offset = 8;

    if (!isMobile && parent) {
      const { top, left, height, width } = parent.getBoundingClientRect();
      const topPosition = top + height + offset;

      // Ensure the dropdown content doesn't go off the screen
      // - the dropdown menu should be placed under the parent element with some offset
      // - if the dropdown menu is too tall, it should be adjusted to fit within the viewport
      // - if the window inner height is smaller than the max height, it should be placed at the top of the viewport
      const maxTopPosition = Math.max(
        Math.min(topPosition, window.innerHeight - MAX_DROPDOWN_HEIGHT),
        0
      );
      setPosition({ top: maxTopPosition, left, width });

      return;
    }

    setPosition({});
  }, [inputRef, isMobile]);

  useLayoutEffect(() => {
    // Use requestAnimationFrame to ensure the parent element is properly painted
    const raf = requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  const filteredCountryList = useMemo(() => {
    const query = debouncedSearchValue.trim().toLowerCase();

    if (!query) {
      return countryList;
    }

    // Match by country name (e.g. "india") OR calling code (with or without a leading "+").
    const numericQuery = query.startsWith('+') ? query.slice(1) : query;

    /**
     * Rank matches so the most relevant result is first (and thus the keyboard-highlighted
     * default): exact name > name starts-with > calling-code starts-with > name contains.
     * Without this, a substring match like "British Indian Ocean Territory" could outrank
     * "India" when the user types "india".
     */
    const score = ({ countryName, countryCallingCode }: CountryMetaData): number => {
      const name = countryName.toLowerCase();

      if (name === query) {
        return 0;
      }
      if (name.startsWith(query)) {
        return 1;
      }
      if (countryCallingCode.startsWith(numericQuery)) {
        return 2;
      }
      if (name.includes(query)) {
        return 3;
      }
      return Number.POSITIVE_INFINITY;
    };

    return countryList
      .map((country) => ({ country, rank: score(country) }))
      .filter(({ rank }) => Number.isFinite(rank))
      // Stable sort by rank; within a rank the original alphabetical order is preserved.
      .sort((previous, next) => previous.rank - next.rank)
      .map(({ country }) => country);
  }, [countryList, debouncedSearchValue]);

  useLayoutEffect(() => {
    if (!debouncedSearchValue) {
      setSelectedCountryCode('');

      return;
    }

    // Auto-highlight the first available result. We track the unique ISO `countryCode`
    // (not the calling code) because multiple countries can share a calling code (e.g. +1).
    const firstCountryCode = filteredCountryList[0]?.countryCode;
    setSelectedCountryCode(firstCountryCode ?? '');
  }, [filteredCountryList, debouncedSearchValue]);

  const onInputKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      const { key } = event;

      switch (key) {
        case 'Enter':
        case ' ': {
          event.preventDefault();
          event.stopPropagation();

          const selected = filteredCountryList.find(
            ({ countryCode }) => countryCode === selectedCountryCode
          );

          if (selected) {
            onCodeChange(selected.countryCallingCode);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          event.stopPropagation();
          onDestroy();
          break;
        }
        case 'ArrowUp':
        case 'ArrowLeft': {
          event.preventDefault();
          event.stopPropagation();

          const currentSelectedIndex = filteredCountryList.findIndex(
            ({ countryCode }) => countryCode === selectedCountryCode
          );

          if (currentSelectedIndex <= 0) {
            return;
          }

          const nextSelected = filteredCountryList[currentSelectedIndex - 1];

          setSelectedCountryCode(nextSelected?.countryCode ?? '');
          break;
        }
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          event.stopPropagation();

          const currentSelectedIndex = filteredCountryList.findIndex(
            ({ countryCode }) => countryCode === selectedCountryCode
          );

          if (currentSelectedIndex >= filteredCountryList.length - 1) {
            return;
          }

          const nextSelected = filteredCountryList[currentSelectedIndex + 1];
          setSelectedCountryCode(nextSelected?.countryCode ?? '');
          break;
        }
        default: {
          break;
        }
      }
    },
    [filteredCountryList, onCodeChange, onDestroy, selectedCountryCode]
  );

  useLayoutEffect(() => {
    const selectedItemDom = document.querySelector(`li[data-id="${selectedCountryCode}"]`);

    if (selectedItemDom) {
      selectedItemDom.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedCountryCode]);

  return (
    <ReactModal
      id="country-code-dropdown"
      isOpen={isOpen}
      // Desktop: invisible click-catcher overlay (the sheet is a positioned popover).
      // Mobile: dimmed mask behind a bottom sheet that slides up from the edge.
      overlayClassName="bg-transparent fixed inset-0 z-40 mobile:z-[var(--z-modal)] mobile:bg-[var(--color-bg-mask)]"
      // Desktop popover keeps its measured `position`. Mobile becomes a bottom sheet:
      // pinned to the bottom edge, full width, capped at 85svh, rounded top, sliding in
      // via translate-y (matches OrganizationSelectorModal's pattern).
      className={
        'absolute z-50 focus-visible:outline-none ' +
        'mobile:inset-x-0 mobile:bottom-0 mobile:top-auto mobile:max-h-[85svh] ' +
        'mobile:rounded-t-[20px] mobile:overflow-hidden mobile:pb-[env(safe-area-inset-bottom)] ' +
        'mobile:translate-y-full mobile:transition-transform mobile:duration-300 mobile:ease-[var(--ease-out)] ' +
        'mobile:[&.ReactModal__Content--after-open]:translate-y-0 ' +
        'mobile:[&.ReactModal__Content--before-close]:translate-y-full'
      }
      style={{
        content: {
          ...position,
        },
      }}
      closeTimeoutMS={isMobile ? 300 : 200}
      onRequestClose={(event) => {
        event.stopPropagation();
        onDestroy();
      }}
    >
      <div
        className="bg-elevated py-2 px-3 desktop:border desktop:border-line-strong desktop:shadow-[var(--sh-float)] desktop:rounded-[13px] desktop:py-3 mobile:flex mobile:flex-col mobile:items-stretch mobile:max-h-[85svh] mobile:rounded-t-[20px] mobile:px-4 mobile:pt-2 mobile:pb-3"
        role="button"
        tabIndex={0}
        onClick={(event) => {
          // Prevent parent node trigger onClick show modal event
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          // Prevent parent node trigger onClick show modal event
          event.stopPropagation();
        }}
      >
        {isMobile && (
          <>
            {/* Grab handle — the standard affordance that signals a draggable/dismissible
                bottom sheet (iOS/Android pattern). Purely visual; tap the mask or Back to close. */}
            <div
              aria-hidden
              className="mx-auto mb-1 mt-0.5 h-1 w-9 shrink-0 rounded-full bg-[var(--color-line-strong)]"
            />
            <NavBar type="back" title={t('input.search_region_code')} onClose={onDestroy} />
          </>
        )}
        <InputField
          autoFocus
          name="country-code-search"
          type="text"
          inputMode="text"
          prefix={<MagnifyingGlassIcon className="w-5 h-5" />}
          value={searchValue}
          className="mb-2 [&_input]:ps-2 [&_svg]:text-muted [&_svg]:self-center mobile:[&:not(:first-child)]:mt-2"
          inputFieldClassName="desktop:py-1.5 desktop:px-3 desktop:h-auto mobile:ps-4"
          placeholder={t('input.search_region_code')}
          onChange={onSearchChange}
          onKeyDown={onInputKeyDown}
        />
        <ul className="-mx-3 px-3 list-none overflow-y-auto desktop:max-h-[400px] mobile:text-base mobile:overflow-auto mobile:flex-1">
          {filteredCountryList.map(({ countryCallingCode, countryCode: countryKeyCode, countryName }) => {
            const isActive = countryCallingCode === countryCode;
            const isSelected = countryKeyCode === selectedCountryCode;

            return (
              <li
                key={countryKeyCode}
                tabIndex={0}
                data-id={countryKeyCode}
                // Expose the keyboard highlight semantically so assistive tech (and tests) can
                // observe which result is active independent of the visual highlight styling.
                aria-selected={isSelected}
                className={classNames(
                  'flex items-center gap-3 py-2.5 px-3 rounded-[11px] cursor-pointer',
                  conditional(isActive && '[&_.calling-code]:text-primary'),
                  conditional(isSelected && 'bg-[var(--color-overlay-neutral-hover)]')
                )}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
                role="button"
                onKeyDown={onKeyDownHandler({
                  Enter: () => {
                    onCodeChange(countryCallingCode);
                  },
                })}
                onClick={() => {
                  onCodeChange(countryCallingCode);
                }}
                onMouseEnter={() => {
                  setSelectedCountryCode(countryKeyCode);
                }}
                onMouseLeave={() => {
                  setSelectedCountryCode('');
                }}
              >
                {FlagUtils.isValidCountryCode(countryKeyCode) && (
                  <DynamicFlag
                    code={countryKeyCode.toLowerCase()}
                    width={24}
                    height={24}
                    aria-hidden="true"
                    className="shrink-0 w-6 h-6 rounded-full shadow-[0_0_0_1px_var(--color-line-divider)]"
                  />
                )}
                <span className="flex-1 truncate text-ink">{countryName}</span>
                <span className="calling-code shrink-0 text-muted [font-variant-numeric:tabular-nums]">{`+${countryCallingCode}`}</span>
                {isActive && <CheckIcon className="shrink-0 ms-1 w-5 h-5 text-primary" />}
              </li>
            );
          })}
        </ul>
        {filteredCountryList.length === 0 && (
          <div className="text-muted py-1 px-2 text-center">
            {t('description.no_region_code_found')}
          </div>
        )}
      </div>
    </ReactModal>
  );
};

export default CountryCodeDropdown;
