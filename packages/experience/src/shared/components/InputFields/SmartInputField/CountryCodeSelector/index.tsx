import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { DynamicFlag, FlagUtils } from '@sankyu/react-circle-flags';
import classNames from 'classnames';
import type { ForwardedRef } from 'react';
import { useState, useMemo, useRef, forwardRef } from 'react';

import { onKeyDownHandler } from '@/shared/utils/a11y';
import {
  getCountryList,
  getDefaultCountryCallingCode,
  getCountryByCallingCode,
} from '@/utils/country-code';

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
  // Timestamp of the last close. A backdrop tap that dismisses the sheet can bubble to
  // this trigger and immediately re-open it ("pops back" bug). Ignore opens fired within
  // a short window of a close so the dismiss gesture can't reopen the sheet.
  const lastClosedAt = useRef(0);
  const countryList = useMemo(getCountryList, []);
  const defaultCountCode = useMemo(getDefaultCountryCallingCode, []);

  const showDropDown = () => {
    if (Date.now() - lastClosedAt.current < 350) {
      return;
    }
    // Blur the phone number input before opening, so the on-screen keyboard dismisses
    // instead of staying up (or re-popping) behind the country sheet/popover on mobile.
    inputRef?.current?.blur();
    setIsDropdownOpen(true);
  };

  const hideDropDown = () => {
    // eslint-disable-next-line @silverhand/fp/no-mutation
    lastClosedAt.current = Date.now();
    setIsDropdownOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const countryCode = value || defaultCountCode;

  // The ISO country for the current calling code, so the trigger can show the flag.
  // `+1` maps to several countries; getCountryByCallingCode prefers the locale default.
  const isoCountryCode = useMemo(() => getCountryByCallingCode(countryCode), [countryCode]);

  // Rendered as a STATIC, in-flow flex button (NOT absolutely positioned / opacity-0 /
  // width-animated). The previous animated-prefix architecture measured the width of an
  // absolute, opacity-0 element via react-spring, which resolved to ~0 on iOS Safari and
  // left the trigger with no tappable area. A real layout box = a real, reliable tap
  // target on every device, and lets us show flag + code + chevron.
  return (
    <div
      ref={ref}
      className={classNames(
        'group/cc relative flex h-full shrink-0 select-none items-center gap-1.5 ps-3.5 pe-2 ' +
          'text-base font-medium text-ink whitespace-nowrap transition-colors duration-150 ' +
          'border-e border-line-strong ' +
          'desktop:text-sm',
        isInteractive && isVisible
          ? 'cursor-pointer hover:bg-[var(--color-overlay-neutral-hover)] active:bg-[var(--color-overlay-neutral-pressed)]'
          : 'pointer-events-none',
        isDropdownOpen && 'bg-[var(--color-overlay-neutral-hover)]',
        // Chevron styling/rotation
        '[&_.cc-chevron]:w-4 [&_.cc-chevron]:h-4 [&_.cc-chevron]:shrink-0 [&_.cc-chevron]:text-muted ' +
          '[&_.cc-chevron]:transition-transform [&_.cc-chevron]:duration-200',
        isDropdownOpen && '[&_.cc-chevron]:rotate-180',
        className
      )}
      role="button"
      tabIndex={isVisible && isInteractive ? 0 : -1}
      aria-haspopup="listbox"
      aria-expanded={isDropdownOpen}
      aria-disabled={!isInteractive}
      // IMPORTANT: do NOT preventDefault on pointerdown here — on touch devices that
      // cancels the synthetic click, so the dropdown never opened. Open on click (fires
      // reliably on tap + mouse), and keep the keyboard down via the input blur() inside
      // showDropDown() rather than by blocking the pointer event.
      onClick={isInteractive ? showDropDown : undefined}
      onKeyDown={
        isInteractive
          ? onKeyDownHandler({
              Enter: showDropDown,
              ' ': showDropDown,
            })
          : undefined
      }
    >
      {isoCountryCode && FlagUtils.isValidCountryCode(isoCountryCode) && (
        <DynamicFlag
          code={isoCountryCode.toLowerCase()}
          width={22}
          height={22}
          aria-hidden="true"
          className="shrink-0 w-[22px] h-[22px] rounded-full shadow-[0_0_0_1px_var(--color-line-divider)]"
        />
      )}
      <span className="tabular-nums">{`+${countryCode}`}</span>
      <ChevronDownIcon className="cc-chevron" />
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
