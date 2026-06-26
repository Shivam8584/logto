import classNames from 'classnames';
import ReactModal from 'react-modal';

import Button from '@/shared/components/Button';

import type { ModalProps } from './type';

const MobileModal = ({
  className,
  isOpen = false,
  isConfirmLoading = false,
  isCancelLoading = false,
  children,
  cancelText = 'action.cancel',
  confirmText = 'action.confirm',
  cancelTextI18nProps,
  confirmTextI18nProps,
  shouldCloseOnEsc = true,
  shouldCloseOnOverlayClick = true,
  onConfirm,
  onClose,
}: ModalProps) => {
  return (
    <ReactModal
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      role="dialog"
      isOpen={isOpen}
      // Drop react-modal's inline default styles (white overlay bg) so the
      // `--color-bg-mask` scrim from `overlayClassName` actually shows. See AcModal.
      style={{ overlay: {}, content: {} }}
      className={classNames(
        'absolute left-5 right-5 top-1/2 max-w-[var(--max-width)] mx-auto -translate-y-1/2 outline-none rounded-[16px] focus-visible:outline-none',
        className
      )}
      overlayClassName={classNames('fixed inset-0 bg-[var(--color-bg-mask)]', 'z-[var(--z-modal)]')}
      onRequestClose={onClose}
    >
      <div className="p-5 bg-elevated rounded-[16px] border border-line shadow-[var(--sh-float)] focus-visible:outline-none">
        <div className="text-center text-base text-ink">{children}</div>
        <div className="flex items-center mt-6 [&>*]:flex-1 [&>button:first-child]:me-3">
          <Button
            title={cancelText}
            i18nProps={cancelTextI18nProps}
            isLoading={isCancelLoading}
            type="secondary"
            onClick={onClose}
          />
          {onConfirm && (
            <Button
              title={confirmText}
              i18nProps={confirmTextI18nProps}
              isLoading={isConfirmLoading}
              onClick={onConfirm}
            />
          )}
        </div>
      </div>
    </ReactModal>
  );
};

export default MobileModal;
