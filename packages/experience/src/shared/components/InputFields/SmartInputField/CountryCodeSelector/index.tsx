import { ChevronDownIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import type { ForwardedRef } from 'react';
import { useState, useMemo, forwardRef } from 'react';

import { onKeyDownHandler } from '@/shared/utils/a11y';
import { getCountryList, getDefaultCountryCallingCode } from '@/utils/country-code';

import CountryCodeDropdown from './CountryCodeDropdown';

type Props = {
  readonly className?: string;
  readonly value?: string;
  readonly inputRef?: React.RefObject<HTMLInputElement | undefined>;
  readonly isVisible?: boolean;
  readonly isInteractive?: boolean;
  readonly onChange?: (value: string) => void;
};

const CountryCodeSelector = (
  { className, value, inputRef, isVisible = true, isInteractive = true, onChange }: Props,
  ref: ForwardedRef<HTMLDivElement>
) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const countryList = useMemo(getCountryList, []);
  const defaultCountCode = useMemo(getDefaultCountryCallingCode, []);

  const showDropDown = () => {
    setIsDropdownOpen(true);
  };

  const hideDropDown = () => {
    setIsDropdownOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const countryCode = value || defaultCountCode;

  return (
    <div
      ref={ref}
      className={classNames(
        'text-base font-medium text-ink border border-transparent rounded-s-[10px] relative h-full ps-4 pe-2 ' +
          'flex items-center whitespace-nowrap opacity-0 pointer-events-none select-none ' +
          'transition-colors duration-150 ' +
          // Clear interactive affordance: cursor + hover/active tint so it reads as a button.
          'cursor-pointer hover:bg-[var(--color-overlay-neutral-hover)] active:bg-[var(--color-overlay-neutral-pressed)] ' +
          'focus-visible:border focus-visible:border-[var(--color-brand-default)] focus-visible:outline-none ' +
          // Chevron sits a touch closer and rotates subtly when the dropdown is open.
          '[&>svg]:shrink-0 [&>svg]:text-muted [&>svg]:ms-1 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:transition-transform [&>svg]:duration-200 ' +
          'desktop:text-sm desktop:[&>svg]:ms-1.5 desktop:[&>svg]:w-5 desktop:[&>svg]:h-5',
        isVisible && 'opacity-100 pointer-events-auto',
        isDropdownOpen && '[&>svg]:rotate-180 text-ink bg-[var(--color-overlay-neutral-hover)]',
        className
      )}
      role="button"
      tabIndex={isVisible && isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      style={isInteractive ? undefined : { pointerEvents: 'none' }}
      onClick={isInteractive ? showDropDown : undefined}
      onKeyDown={
        isInteractive
          ? onKeyDownHandler({
              Enter: showDropDown,
            })
          : undefined
      }
    >
      <span>{`+${countryCode}`}</span>
      <ChevronDownIcon />
      <CountryCodeDropdown
        inputRef={inputRef}
        isOpen={isDropdownOpen}
        countryCode={countryCode}
        countryList={countryList}
        onClose={hideDropDown}
        onChange={onChange}
      />
    </div>
  );
};

export default forwardRef(CountryCodeSelector);
