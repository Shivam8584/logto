import classNames from 'classnames';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Each strength level sets the `--strength-color` CSS var that filled segments consume.
const strengthColorByLevel = {
  weak: '[--strength-color:var(--color-danger-default)]',
  fair: '[--strength-color:var(--color-alert-60)]',
  good: '[--strength-color:var(--color-alert-70)]',
  strong: '[--strength-color:var(--color-success-default)]',
} as const;

type Props = {
  readonly password: string;
  readonly className?: string;
};

const segmentCount = 4;

/**
 * Compute a lightweight password strength score in the range 0-4 based on length and
 * character variety (lowercase, uppercase, number, symbol). This is purely a UX hint
 * and is intentionally self-contained (no extra dependency such as zxcvbn).
 */
const computeStrength = (password: string): number => {
  if (!password) {
    return 0;
  }

  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^\dA-Za-z]/].filter((regex) =>
    regex.test(password)
  ).length;

  const score =
    // Length contribution.
    (password.length >= 8 ? 1 : 0) +
    (password.length >= 12 ? 1 : 0) +
    // Variety contribution.
    (variety >= 3 ? 1 : 0) +
    (variety >= 4 ? 1 : 0);

  // Score can legitimately be 0 for trivial input (e.g. a couple of lowercase letters).
  // We do NOT floor it to 1, so the meter doesn't flash a red "Weak" bar on the very first
  // keystroke — it stays neutral until the password earns at least one point.
  return Math.min(score, segmentCount);
};

const strengthLevels = ['weak', 'fair', 'good', 'strong'] as const;

const StrengthMeter = ({ password, className }: Props) => {
  const { t } = useTranslation();

  const score = useMemo(() => computeStrength(password), [password]);
  // A score of 0 is "too weak to rate yet" — treat its label as weak but render the meter
  // in a neutral (unfilled) state via the score-driven segment fill below.
  const level = strengthLevels[Math.max(score - 1, 0)] ?? 'weak';
  const label = t(`input.password_strength.${level}`);

  return (
    <div
      className={classNames(
        'pt-1.5 ms-0.5 [--strength-color:var(--color-danger-default)]',
        strengthColorByLevel[level],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5 w-full">
        {Array.from({ length: segmentCount }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={classNames(
              'flex-1 h-1 rounded-[11px] bg-[var(--color-bg-state-unselected)] [transition:background-color_0.2s_ease-in-out,transform_0.2s_ease-in-out] motion-reduce:transition-none',
              index < score && 'bg-[var(--strength-color)]'
            )}
          />
        ))}
      </div>
      <span className="block text-sm text-muted pt-1">
        {t('input.password_strength.label', { strength: label })}
      </span>
    </div>
  );
};

export default StrengthMeter;
