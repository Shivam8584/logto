import { InformationCircleIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import type { CSSProperties, ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import TextLink from '@/components/TextLink';

/* eslint-disable react/require-default-props */
type Props = {
  readonly className?: string;
  readonly message: ReactNode;
  readonly onClose: () => void;
  readonly style?: CSSProperties;
};
/* eslint-enable react/require-default-props */

const AppNotification = forwardRef(
  ({ className, message, style, onClose }: Props, ref: ForwardedRef<HTMLDivElement>) => {
    return (
      <div
        ref={ref}
        className={classNames(
          'flex items-center p-3 text-sm text-ink-2 bg-surface border border-line rounded-[13px] shadow-[var(--sh-float)] z-50',
          className
        )}
        style={style}
      >
        <InformationCircleIcon className="w-5 h-5 me-3 text-muted" />
        <div className="flex-1 min-w-0 me-4 [overflow-wrap:anywhere]">{message}</div>
        <TextLink text="action.got_it" className="max-w-[20%]" onClick={onClose} />
      </div>
    );
  }
);

export default AppNotification;
