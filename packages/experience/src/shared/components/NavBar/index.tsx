import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { onKeyDownHandler } from '@/shared/utils/a11y';

import FlipOnRtl from '../FlipOnRtl';

const navBarClass =
  'w-full min-h-[44px] flex items-center justify-center py-3 px-10 relative text-ink [&>svg]:fill-current ' +
  'mobile:data-[hidden]:invisible desktop:data-[hidden]:hidden';

// Back/skip present a 44px tap target on mobile (icon-only back button is otherwise ~28px,
// below Apple HIG). Padding stays visually compact; min-h/min-w grow only the hit area.
const navButtonClass =
  'absolute start-0 top-1/2 -translate-y-1/2 text-sm font-medium flex items-center justify-center cursor-pointer gap-1 py-1 px-2 -ms-2 rounded-[11px] ' +
  'mobile:min-h-[44px] mobile:min-w-[44px] ' +
  'transition-[background-color] duration-150 ease-in-out motion-reduce:transition-none ' +
  'overlay-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-default)] focus-visible:outline-offset-1 ' +
  'mobile:[&>span]:hidden';

const skipButtonClass =
  'absolute end-0 top-1/2 -translate-y-1/2 text-base font-medium cursor-pointer text-primary py-1 px-2 -me-1 rounded-[11px] ' +
  'flex items-center justify-center mobile:min-h-[44px] mobile:min-w-[44px] ' +
  'transition-[background-color] duration-150 ease-in-out motion-reduce:transition-none ' +
  'overlay-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-default)] focus-visible:outline-offset-1 ' +
  'desktop:text-sm';

type Props = {
  readonly title?: string;
  readonly type?: 'back' | 'close';
  readonly isHidden?: boolean;
  readonly onClose?: () => void;
  readonly onBack?: () => void;
  readonly onSkip?: () => void;
};

const NavBar = ({ title, type = 'back', isHidden, onClose, onBack, onSkip }: Props) => {
  const { t } = useTranslation();

  const isClosable = type === 'close';
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();

      return;
    }

    window.history.back();
  }, [onBack]);

  const clickHandler = useCallback(() => {
    if (onClose) {
      onClose();

      return;
    }

    if (isClosable) {
      window.close();

      return;
    }

    handleBack();
  }, [handleBack, isClosable, onClose]);

  return (
    <div
      className={navBarClass}
      // `||` is intentional: when isHidden is false we want `undefined` to drop the data attribute, not `false`.
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      data-hidden={isHidden || undefined}
    >
      <div
        role="button"
        tabIndex={0}
        className={navButtonClass}
        onKeyDown={onKeyDownHandler(clickHandler)}
        onClick={clickHandler}
      >
        {isClosable ? (
          <XMarkIcon className="w-5 h-5" />
        ) : (
          <FlipOnRtl>
            <ChevronLeftIcon className="w-5 h-5" />
          </FlipOnRtl>
        )}
        {!isClosable && <span>{t('action.nav_back')}</span>}
      </div>
      {title && <div className="navBarTitle truncate max-w-[60%] mx-auto">{title}</div>}
      {onSkip && (
        <div
          role="button"
          tabIndex={0}
          className={skipButtonClass}
          onKeyDown={onKeyDownHandler(onSkip)}
          onClick={onSkip}
        >
          <span>{t('action.nav_skip')}</span>
        </div>
      )}
    </div>
  );
};

export default NavBar;
