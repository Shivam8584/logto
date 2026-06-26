import { XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactModal from 'react-modal';

import Button from '@/shared/components/Button';
import IconButton from '@/shared/components/IconButton';
import { onKeyDownHandler } from '@/shared/utils/a11y';

import type { ModalProps } from './type';

const AcModal = ({
  className,
  isOpen = false,
  isConfirmLoading = false,
  isCancelLoading = false,
  children,
  cancelText = 'action.cancel',
  confirmText = 'action.confirm',
  confirmTextI18nProps,
  cancelTextI18nProps,
  shouldCloseOnOverlayClick = true,
  shouldCloseOnEsc = true,
  onConfirm,
  onClose,
}: ModalProps) => {
  const { t } = useTranslation();

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <ReactModal
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      role="dialog"
      isOpen={isOpen}
      // React-modal injects inline default styles (a white overlay background +
      // absolutely-positioned content) when no `style` is passed. Inline styles
      // win over `overlayClassName`, so the `--color-bg-mask` scrim never shows
      // and the page bleeds through behind the dialog. Empty objects drop those
      // defaults and let our classes take effect.
      style={{ overlay: {}, content: {} }}
      className={classNames(
        'absolute w-[600px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none rounded-[16px] focus-visible:outline-none max-[640px]:w-[calc(100%-40px)]',
        className
      )}
      overlayClassName={classNames('fixed inset-0 bg-[var(--color-bg-mask)]', 'z-[var(--z-modal)]')}
      onAfterOpen={() => {
        contentRef.current?.focus();
      }}
      onRequestClose={onClose}
    >
      <div
        ref={contentRef}
        className="bg-elevated rounded-[16px] border border-line shadow-[var(--sh-float)] p-6 focus-visible:outline-none"
        role="button"
        tabIndex={0}
        onKeyDown={onKeyDownHandler({
          Enter: onConfirm ?? onClose,
          ' ': onConfirm ?? onClose,
          Escape: onClose,
        })}
      >
        <div className="flex items-center justify-between text-lg font-semibold text-ink mb-4 [&_svg]:w-6 [&_svg]:h-6">
          {t('description.reminder')}
          <IconButton onClick={onClose}>
            <XMarkIcon />
          </IconButton>
        </div>
        <div className="text-sm text-ink mb-6">{children}</div>
        <div className="flex items-center justify-end [&>*]:shrink [&>button:first-child]:me-3">
          <Button
            title={cancelText}
            type="secondary"
            i18nProps={cancelTextI18nProps}
            size="small"
            isLoading={isCancelLoading}
            onClick={onClose}
          />
          {onConfirm && (
            <Button
              title={confirmText}
              i18nProps={confirmTextI18nProps}
              size="small"
              isLoading={isConfirmLoading}
              onClick={onConfirm}
            />
          )}
        </div>
      </div>
    </ReactModal>
  );
};

export default AcModal;
