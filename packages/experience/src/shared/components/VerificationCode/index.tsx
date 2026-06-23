import type { FormEventHandler, KeyboardEventHandler, ClipboardEventHandler } from 'react';
import { useMemo, useRef, useCallback, useEffect } from 'react';

import ErrorMessage from '@/shared/components/ErrorMessage';

// On mobile the boxes flex to fill the field width evenly (so 6 cells always span the
// container with no awkward right-edge gap), while staying ≥44px tall/wide for Apple HIG.
// Desktop keeps fixed 44×52 boxes. 18px font throughout keeps iOS from zoom-on-focus.
const passcodeClass =
  'flex items-center gap-2.5 mobile:gap-2 mobile:w-full ' +
  '[&_input]:w-11 [&_input]:h-[52px] [&_input]:rounded-[12px] [&_input]:border [&_input]:border-line-strong [&_input]:bg-elevated ' +
  '[&_input]:text-center [&_input]:text-lg [&_input]:font-semibold [&_input]:text-ink [&_input]:[caret-color:var(--color-brand-default)] ' +
  '[&_input]:[font-variant-numeric:tabular-nums] [&_input]:tracking-wide [&_input]:shadow-[var(--sh-input)] ' +
  '[&_input]:transition-[outline-color,border-color,background-color] [&_input]:duration-100 [&_input]:ease-in-out motion-reduce:[&_input]:transition-none ' +
  '[&_input:focus]:border-[var(--color-brand-default)] [&_input:focus]:outline-none ' +
  '[&_input::placeholder]:text-muted ' +
  // Mobile: each cell flexes to share the row equally, clamped to a comfortable ≥44px min.
  'mobile:[&_input]:flex-1 mobile:[&_input]:min-w-[44px] mobile:[&_input]:w-auto mobile:[&_input]:h-[52px] mobile:[&_input]:min-h-[44px] ' +
  'desktop:[&_input]:text-lg desktop:[&_input]:outline desktop:[&_input]:outline-[3px] desktop:[&_input]:outline-transparent ' +
  'desktop:[&_input:focus]:outline-[var(--color-overlay-brand-focused)] ' +
  '[&_input:focus]:outline [&_input:focus]:outline-[3px] [&_input:focus]:outline-[var(--color-overlay-brand-focused)] ' +
  'desktop:[&_input:hover:not(:focus)]:bg-[var(--color-overlay-neutral-hover)]';

export const defaultLength = 6;

export type Props = {
  readonly name: string;
  readonly className?: string;
  readonly length?: number;
  readonly value: string[];
  readonly error?: string;
  readonly onChange: (value: string[]) => void;
};

const isNumeric = (char: string) => /^\d+$/.test(char);

const normalize = (value: string[], length: number): string[] => {
  if (value.length > length) {
    return value.slice(0, length);
  }

  if (value.length < length) {
    // Undefined will not overwrite the original input displays, need to pass in empty string instead
    return value.concat(Array.from<string>({ length: length - value.length }).fill(''));
  }

  return value;
};

const VerificationCode = ({
  name,
  className,
  value,
  length = defaultLength,
  error,
  onChange,
}: Props) => {
  /* eslint-disable @typescript-eslint/ban-types */
  const inputReferences = useRef<Array<HTMLInputElement | null>>(
    Array.from<null>({ length }).fill(null)
  );
  /* eslint-enable @typescript-eslint/ban-types */

  const codes = useMemo(() => normalize(value, length), [length, value]);

  const updateValue = useCallback(
    (data: string, targetId: number) => {
      // Filter non-numeric input
      if (!isNumeric(data)) {
        return;
      }

      const chars = data.split('');
      const trimmedChars = chars.slice(0, Math.min(chars.length, codes.length - targetId));

      const value = [
        ...codes.slice(0, targetId),
        ...trimmedChars,
        ...codes.slice(targetId + trimmedChars.length, codes.length),
      ];

      onChange(value);

      // Move to the next target
      const nextTarget =
        inputReferences.current[Math.min(targetId + trimmedChars.length, codes.length - 1)];
      nextTarget?.focus();
    },
    [codes, onChange]
  );

  const onInputHandler: FormEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const { target } = event;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const { value, dataset } = target;

      // Unrecognized target input field
      if (!dataset.id) {
        return;
      }

      event.preventDefault();
      updateValue(value, Number(dataset.id));
    },
    [updateValue]
  );

  const onPasteHandler: ClipboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const {
        target: { dataset },
        clipboardData,
      } = event;

      const data = clipboardData.getData('text').match(/\d/g)?.join('') ?? '';

      // Unrecognized target input field
      if (!dataset.id) {
        return;
      }

      event.preventDefault();
      updateValue(data, Number(dataset.id));
    },
    [updateValue]
  );

  const onKeyDownHandler: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const { key, target } = event;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const { value, dataset } = target;

      if (!dataset.id) {
        return;
      }

      const targetId = Number(dataset.id);

      const nextTarget = inputReferences.current[targetId + 1];
      const previousTarget = inputReferences.current[targetId - 1];

      switch (key) {
        case 'Backspace': {
          event.preventDefault();

          if (value) {
            onChange(Object.assign([], codes, { [targetId]: '' }));
            break;
          }

          if (previousTarget) {
            previousTarget.focus();
            onChange(Object.assign([], codes, { [targetId - 1]: '' }));
          }

          break;
        }

        case 'ArrowLeft': {
          event.preventDefault();
          previousTarget?.focus();
          break;
        }

        case 'ArrowRight': {
          event.preventDefault();
          nextTarget?.focus();
          break;
        }
        case '+':
        case '-':
        case 'e':
        case '.':
        case 'ArrowUp':
        case 'ArrowDown': {
          event.preventDefault();
          break;
        }

        default: {
          break;
        }
      }
    },
    [codes, onChange]
  );

  useEffect(() => {
    if (value.length === 0) {
      inputReferences.current[0]?.focus();
    }
  }, [value]);

  return (
    <div className={className}>
      <div className={passcodeClass} role="group" aria-label="Verification code">
        {Array.from({ length }).map((_, index) => (
          <input
            ref={(element) => {
              // eslint-disable-next-line @silverhand/fp/no-mutation
              inputReferences.current[index] = element;
            }}
            // eslint-disable-next-line react/no-array-index-key
            key={`${name}_${index}`}
            name={`${name}_${index}`}
            data-id={index}
            value={codes[index]}
            /**
             * Use `text` + `inputMode="numeric"` rather than `type="number"`: it shows the
             * numeric keypad, avoids browser spin buttons / scroll-to-change quirks, and
             * preserves leading zeros. Non-digits are still rejected by `updateValue`.
             */
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            // `one-time-code` on the first box lets iOS/Android offer SMS OTP autofill.
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${index + 1}`}
            onPaste={onPasteHandler}
            onInput={onInputHandler}
            onKeyDown={onKeyDownHandler}
          />
        ))}
      </div>
      {error && <ErrorMessage className="ms-0.5 mt-1">{error}</ErrorMessage>}
    </div>
  );
};

export default VerificationCode;
