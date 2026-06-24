import classNames from 'classnames';
import type { TFuncKey } from 'i18next';

import DynamicT from '@/shared/components/DynamicT';

type Props = {
  readonly className?: string;
  readonly label?: TFuncKey;
};

const Divider = ({ className, label }: Props) => {
  const lineStyle = classNames('flex-1 h-px bg-line', label && 'first:me-4 last:ms-4');

  return (
    <div
      // Lighter weight + slight transparency so the "or" reads as a quiet separator,
      // not a heading (matches the refined custom CSS: 13px/400, subtle).
      className={classNames(
        'flex items-center text-[13px] font-normal text-muted opacity-90 [&>span]:px-1',
        className
      )}
    >
      <i className={lineStyle} />
      {label && (
        <>
          <DynamicT forKey={label} />
          <i className={lineStyle} />
        </>
      )}
    </div>
  );
};

export default Divider;
