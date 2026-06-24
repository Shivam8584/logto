import classNames from 'classnames';
import type { TFuncKey } from 'i18next';

import DynamicT from '@/shared/components/DynamicT';

type Props = {
  readonly className?: string;
  readonly message: TFuncKey;
};

const InlineNotification = ({ className, message }: Props) => {
  return (
    <div
      className={classNames(
        // 12px/14px padding + 16px bottom margin for proper breathing room (was p-3/mb-2).
        'flex items-center px-3.5 py-3 text-sm mx-auto mb-4 surface-warning',
        className
      )}
    >
      <DynamicT forKey={message} />
    </div>
  );
};

export default InlineNotification;
