import classNames from 'classnames';
import type { HTMLProps, Ref } from 'react';
import { forwardRef } from 'react';

// min-w/h 44px meets Apple HIG's minimum tap target. The icon itself stays small
// (callers pass w-5/h-5) and is centred, so the hit area grows without changing the
// visual weight — important for the password-eye / input-clear buttons that sit inside
// fields. Desktop shrinks to 32px since pointer targeting is precise there.
const iconButtonClass =
  'border-none outline-none bg-none border-transparent rounded-[11px] flex flex-col items-center justify-center cursor-pointer ' +
  'min-w-[44px] min-h-[44px] shrink-0 desktop:min-w-8 desktop:min-h-8 ' +
  '[&>svg]:text-muted active:bg-[var(--color-overlay-neutral-pressed)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-overlay-brand-focused)] focus-visible:outline-offset-1 ' +
  'desktop:hover:[&:not(:active)]:bg-[var(--color-overlay-neutral-hover)]';

export type Props = Omit<HTMLProps<HTMLButtonElement>, 'type'>;

const IconButton = ({ children, className, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
  return (
    <button ref={ref} type="button" className={classNames(iconButtonClass, className)} {...rest}>
      {children}
    </button>
  );
};

export default forwardRef<HTMLButtonElement, Props>(IconButton);
