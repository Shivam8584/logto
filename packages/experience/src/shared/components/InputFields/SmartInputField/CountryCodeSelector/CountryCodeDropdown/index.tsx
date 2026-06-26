/* eslint-disable max-lines */
import { CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DynamicFlag, FlagUtils } from '@sankyu/react-circle-flags';
import { conditional } from '@silverhand/essentials';
import classNames from 'classnames';
import type { KeyboardEventHandler } from 'react';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactModal from 'react-modal';
import { Sheet } from 'react-modal-sheet';

import useDebounce from '@/hooks/use-debounce';
import usePlatform from '@/hooks/use-platform';
import InputField from '@/shared/components/InputFields/InputField';
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

  // On mobile the search field carries inputMode="none" by default, so opening the sheet
  // shows the full country list WITHOUT the on-screen keyboard covering it (the robust,
  // cross-browser fix — blur()/preventDefault alone are unreliable on iOS Safari). The
  // keyboard is enabled only when the user deliberately taps the search field to type.
  const [isSearchEngaged, setIsSearchEngaged] = useState(false);

  const onSearchPointerDown = useCallback(() => {
    setIsSearchEngaged(true);
  }, []);

  const onSearchChange = useCallback(({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(target.value);
  }, []);

  const onDestroy = useCallback(() => {
    setSearchValue('');
    setIsSearchEngaged(false);
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

    return (
      countryList
        .map((country) => ({ country, rank: score(country) }))
        .filter(({ rank }) => Number.isFinite(rank))
        // Stable sort by rank; within a rank the original alphabetical order is preserved.
        .slice()
        .sort((previous, next) => previous.rank - next.rank)
        .map(({ country }) => country)
    );
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

  // Search field — shared by the desktop popover and the mobile sheet.
  const searchField = (
    <InputField
      // Autofocus the search ONLY on desktop. On mobile, autofocusing pops the on-screen
      // keyboard the instant the sheet opens, covering the list. The user taps to search.
      autoFocus={!isMobile}
      name="country-code-search"
      prefix={<MagnifyingGlassIcon className="w-5 h-5" />}
      value={searchValue}
      className="mb-2 [&_input]:ps-2 [&_svg]:text-muted [&_svg]:self-center"
      inputFieldClassName="desktop:py-1.5 desktop:px-3 desktop:h-auto mobile:ps-4"
      placeholder={t('input.search_region_code')}
      type="text"
      // InputMode="none" on mobile until the user taps the field — keeps the keyboard down.
      inputMode={isMobile && !isSearchEngaged ? 'none' : 'text'}
      onPointerDown={isMobile ? onSearchPointerDown : undefined}
      onChange={onSearchChange}
      onKeyDown={onInputKeyDown}
    />
  );

  // Country list — shared by both surfaces. No negative margins / horizontal padding here
  // (those caused sideways scroll inside the sheet); spacing is owned by each wrapper.
  // On desktop the popover wrapper caps + scrolls; on mobile Sheet.Content scrolls.
  const countryListElement = (
    <>
      <ul className="list-none mobile:text-base desktop:max-h-[400px] desktop:overflow-y-auto">
        {filteredCountryList.map(
          ({ countryCallingCode, countryCode: countryKeyCode, countryName }) => {
            const isActive = countryCallingCode === countryCode;
            const isSelected = countryKeyCode === selectedCountryCode;

            return (
              // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-selected mirrors the highlighted row for the custom button-role list
              <li
                key={countryKeyCode}
                tabIndex={0}
                data-id={countryKeyCode}
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
                <span className="flex-1 truncate text-ink" title={countryName}>
                  {countryName}
                </span>
                <span className="calling-code shrink-0 text-muted [font-variant-numeric:tabular-nums]">{`+${countryCallingCode}`}</span>
                {isActive && <CheckIcon className="shrink-0 ms-1 w-5 h-5 text-primary" />}
              </li>
            );
          }
        )}
      </ul>
      {filteredCountryList.length === 0 && (
        <div className="text-muted py-1 px-2 text-center">
          {t('description.no_region_code_found')}
        </div>
      )}
    </>
  );

  // Mobile: a real bottom sheet (react-modal-sheet / Motion) — native iOS-style
  // drag-to-dismiss, momentum, focus trap and a11y handled by the library. `detent="content"`
  // sizes it to the content, capped by the sheet's own max height.
  if (isMobile) {
    return (
      <Sheet
        // Lift the sheet above the on-screen keyboard if the search field is focused.
        avoidKeyboard
        // Size to content (capped by Container max-height), not a fixed snap.
        detent="content"
        isOpen={isOpen}
        // SINGLE close handler — fires for backdrop tap, drag-down dismiss, and Esc.
        // (Putting onTap on the backdrop too double-fired and bubbled to the trigger
        // underneath, re-opening the sheet — that was the "pops back" bug.)
        onClose={onDestroy}
      >
        <Sheet.Container
          className="!bg-elevated !rounded-t-[20px] !shadow-[var(--sh-float)]"
          style={{ maxHeight: '85svh' }}
        >
          {/* Passing children to Sheet.Header suppresses its built-in drag indicator, so we
              render our own grab handle once (a single line — the earlier extra
              Sheet.DragIndicator was the stray grey line). The whole header is the drag
              surface. */}
          <Sheet.Header className="!bg-transparent">
            <div className="flex flex-col px-4 pb-1 pt-2">
              <div
                aria-hidden
                className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-[var(--color-line-strong)]"
              />
              <div className="mb-3 text-center text-sm font-medium text-ink">
                {t('input.search_region_code')}
              </div>
              {searchField}
            </div>
          </Sheet.Header>
          {/* Sheet.Content has a BUILT-IN vertical scroller (styled via scrollClassName) —
              we add no overflow utilities of our own. disableDrag while the list is mid-
              scroll so the gesture scrolls instead of dragging the sheet shut. */}
          <Sheet.Content
            disableDrag={({ scrollPosition }) => scrollPosition !== 'top'}
            scrollClassName="px-4 pb-[max(env(safe-area-inset-bottom),12px)] overscroll-contain"
          >
            {countryListElement}
          </Sheet.Content>
        </Sheet.Container>
        {/* The backdrop is only interactive when given a handler (the lib sets
            pointer-events:none otherwise), so onTap IS required to close on outside-tap.
            The selector trigger guards against the same tap re-opening it (see
            CountryCodeSelector: it ignores opens for a moment after close). */}
        <Sheet.Backdrop className="!bg-[var(--color-bg-mask)]" onTap={onDestroy} />
      </Sheet>
    );
  }

  // Desktop: positioned popover under the field (unchanged react-modal behavior).
  return (
    <ReactModal
      id="country-code-dropdown"
      isOpen={isOpen}
      overlayClassName="bg-transparent fixed inset-0 z-40"
      className="absolute z-50 focus-visible:outline-none"
      style={{ content: { ...position } }}
      closeTimeoutMS={200}
      onRequestClose={(event) => {
        event.stopPropagation();
        onDestroy();
      }}
    >
      <div
        className="bg-elevated py-3 px-3 border border-line-strong shadow-[var(--sh-float)] rounded-[13px]"
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      >
        {searchField}
        {countryListElement}
      </div>
    </ReactModal>
  );
};

export default CountryCodeDropdown;
/* eslint-enable max-lines */
