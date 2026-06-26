import { condString, type Nullable } from '@silverhand/essentials';
import classNames from 'classnames';
import type { HTMLProps, ReactElement, Ref } from 'react';
import { forwardRef, cloneElement, useState, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '@/shared/components/ErrorMessage';

/**
 * Modern text input — a static label above a cleanly-bordered field.
 * Replaces the old Material-style "notched border" (where the label cut into
 * the border) with the Stripe/Linear convention: a small label, then a 10px
 * rounded box that gains a near-black border + soft focus ring on focus.
 *
 * The <input> is reached via `[&_input]` descendant variants; placeholder /
 * caret / autofill behaviour is preserved from the original component.
 */
// `rounded` + a clipped child is avoided here: no `overflow-hidden` on the box, because a
// static country-code prefix (and its popover/bottom-sheet dropdown) must not be clipped.
// The prefix carries its own start radius via the box's rounding; the input fills the rest.
const fieldBoxClass =
  'relative flex items-stretch h-12 rounded-[11px] border bg-elevated ' +
  'shadow-[var(--sh-input)] transition-[border-color,box-shadow] duration-150 ease-out ' +
  '[&_input]:flex-1 [&_input]:min-w-0 [&_input]:pe-3.5 [&_input]:bg-transparent [&_input]:outline-none ' +
  '[&_input]:text-base desktop:[&_input]:text-sm [&_input]:text-ink [&_input]:[caret-color:var(--color-brand-default)] ' +
  '[&_input::placeholder]:text-faint ' +
  '[&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--color-type-primary)] ' +
  '[&_input:-webkit-autofill]:[transition:background-color_999999s_ease-in-out_0s] ' +
  '[&_input:-webkit-autofill]:[animation:onAutoFillStart_0.01s_forwards] ' +
  '[&_input:not(:-webkit-autofill)]:[animation:onAutoFillCancel_0.01s_forwards]';

export type Props = Omit<HTMLProps<HTMLInputElement>, 'prefix'> & {
  readonly className?: string;
  readonly inputFieldClassName?: string;
  readonly errorMessage?: string;
  readonly isDanger?: boolean;
  readonly prefix?: ReactElement;
  readonly isPrefixVisible?: boolean;
  readonly suffix?: ReactElement;
  readonly isSuffixFocusVisible?: boolean;
  readonly label?: ReactElement | string;
  readonly description?: Nullable<string>;
};

const InputField = (
  {
    className,
    inputFieldClassName,
    errorMessage,
    isDanger,
    prefix,
    suffix,
    isPrefixVisible,
    isSuffixFocusVisible,
    label,
    description,
    onFocus,
    onBlur,
    onChange,
    value,
    required = true,
    ...props
  }: Props,
  reference: Ref<Nullable<HTMLInputElement>>
) => {
  const { t } = useTranslation();
  const innerRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(reference, () => innerRef.current);

  const errorMessages = errorMessage?.split('\n');

  const [isFocused, setIsFocused] = useState(false);

  const labelWithOptionalSuffix = required
    ? label
    : condString(label && t('input.label_with_optional', { label }));

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-ink-2">
          {labelWithOptionalSuffix}
        </label>
      )}
      <div
        className={classNames(
          fieldBoxClass,
          // Resting / focus / danger border + ring
          isDanger ? 'border-danger' : isFocused ? 'border-primary' : 'border-line-strong',
          isFocused && !isDanger && 'shadow-[var(--sh-input),0_0_0_3px_var(--primary-tint)]',
          isFocused && isDanger && 'shadow-[var(--sh-input),0_0_0_3px_var(--danger-soft)]',
          isDanger && '[&_input]:[caret-color:var(--color-danger-default)]',
          isSuffixFocusVisible && 'focus-within:[&_input]:pe-10 [&:focus-within_.suffix]:flex',
          inputFieldClassName
        )}
      >
        {prefix}
        <input
          {...props}
          // Start padding only when there's no prefix; the country selector supplies its
          // own inset (ps-3.5) so the number text aligns right after the divider.
          ref={innerRef}
          className={classNames(isPrefixVisible ? 'ps-2.5' : 'ps-3.5')}
          value={value}
          onFocus={(event) => {
            setIsFocused(true);
            return onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            return onBlur?.(event);
          }}
          onChange={onChange}
        />
        {suffix &&
          cloneElement(suffix, {
            className: classNames([
              suffix.props.className,
              'suffix absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 hidden z-[1]',
            ]),
          })}
      </div>
      {description && <div className="text-sm text-muted pt-1 ms-0.5">{description}</div>}
      {errorMessages && (
        <ErrorMessage className="mt-1.5 ms-0.5">
          {errorMessages.length > 1 ? (
            <ul>
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            errorMessages[0]
          )}
        </ErrorMessage>
      )}
    </div>
  );
};
export default forwardRef(InputField);
