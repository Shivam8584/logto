import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import { type HTMLProps } from 'react';
import { useDebouncedLoader } from 'use-debounced-loader';

import DynamicT from '@/shared/components/DynamicT';

import RotatingRingIcon from './RotatingRingIcon';

export type ButtonType = 'primary' | 'secondary' | 'danger';

type BaseProps = Omit<HTMLProps<HTMLButtonElement>, 'type' | 'size' | 'title'> & {
  readonly htmlType?: 'button' | 'submit' | 'reset';
  readonly type?: ButtonType;
  readonly size?: 'small' | 'large';
  readonly isDisabled?: boolean;
  readonly isLoading?: boolean;
  readonly className?: string;
  readonly onClick?: React.MouseEventHandler;
};

type Props = BaseProps & {
  readonly title: TFuncKey;
  readonly icon?: React.ReactNode;
  readonly i18nProps?: Record<string, string>;
};

const baseClass =
  'relative flex flex-row items-center justify-center h-12 px-4 rounded-[11px] font-semibold text-base overflow-hidden select-none outline-none appearance-none [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none desktop:text-[15px]';

const typeClass: Record<ButtonType, string> = {
  primary: 'btn-primary',
  secondary: 'btn-ghost',
  danger: 'btn-danger',
};

const sizeClass = (size: 'small' | 'large'): string =>
  size === 'large' ? 'w-full' : 'min-w-[85px]';

const Button = ({
  htmlType = 'button',
  type = 'primary',
  size = 'large',
  title,
  i18nProps,
  className,
  isDisabled = false,
  isLoading = false,
  icon,
  onClick,
  ...rest
}: Props) => {
  // 100ms debounce: responsive but suppresses spinner flash on instant responses.
  const isLoadingActive = useDebouncedLoader(isLoading, 100);

  return (
    <button
      disabled={isDisabled || isLoading}
      className={classNames(baseClass, typeClass[type], sizeClass(size), className)}
      type={htmlType}
      onClick={onClick}
      {...rest}
    >
      <span
        className={classNames(
          'relative inline-flex items-center justify-center transition-[padding] duration-200',
          (isLoadingActive || Boolean(icon)) && 'ps-7'
        )}
      >
        <span
          className={classNames(
            'absolute inset-inline-start-0 inline-flex items-center transition-opacity duration-200',
            isLoadingActive || icon ? 'opacity-100' : 'opacity-0'
          )}
        >
          {isLoadingActive ? <RotatingRingIcon /> : icon}
        </span>
        <span className="truncate">
          <DynamicT forKey={title} interpolation={i18nProps} />
        </span>
      </span>
    </button>
  );
};

export default Button;
