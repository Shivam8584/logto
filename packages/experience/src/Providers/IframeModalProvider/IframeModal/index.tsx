import classNames from 'classnames';
import { useRef, useState } from 'react';
import ReactModal from 'react-modal';
import type { LoadingBarRef } from 'react-top-loading-bar';
import LoadingBar from 'react-top-loading-bar';

import NavBar from '@/shared/components/NavBar';

type ModalProps = {
  readonly className?: string;
  readonly title?: string;
  readonly href?: string;
  readonly onClose: () => void;
};

const IframeModal = ({ className, title = '', href = '', onClose }: ModalProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const loadingBarRef = useRef<LoadingBarRef>(null);

  // Read the live brand colour from the cascade (falls back to the blue accent,
  // never the old Logto purple).
  const brandingColor =
    getComputedStyle(document.documentElement).getPropertyValue('--color-brand-default').trim() ||
    '#2563eb';

  return (
    <ReactModal
      shouldCloseOnEsc
      id="iframe-modal"
      role="dialog"
      isOpen={Boolean(href)}
      // Drop react-modal's inline default styles (white overlay bg) — this modal
      // is a full-screen iframe surface, the inline white tint shows through. See AcModal.
      style={{ overlay: {}, content: {} }}
      className={classNames(
        'z-[var(--z-modal)] absolute inset-0 overflow-auto focus-visible:outline-none',
        className
      )}
      overlayClassName="z-[var(--z-modal)]"
      closeTimeoutMS={300}
      onAfterOpen={() => {
        loadingBarRef.current?.continuousStart();
      }}
      onRequestClose={onClose}
    >
      <div className="bg-elevated h-full flex flex-col items-stretch justify-center overflow-hidden focus-visible:outline-none">
        <div className="py-2 px-5">
          <NavBar type="close" title={title} onClose={onClose} />
        </div>
        <LoadingBar
          ref={loadingBarRef}
          containerStyle={{ position: 'relative' }}
          shadow={false}
          color={brandingColor}
          waitingTime={300}
          className="bg-primary"
        />
        <div className="flex-1 w-full">
          <iframe
            title={title}
            src={href}
            sandbox="allow-same-origin"
            className={classNames(
              'w-full h-full border-none bg-elevated opacity-0 transition-opacity duration-200 ease-in-out',
              isLoaded && 'opacity-100'
            )}
            onLoad={() => {
              setIsLoaded(true);
              loadingBarRef.current?.complete();
            }}
            onError={() => {
              setIsLoaded(true);
              loadingBarRef.current?.complete();
            }}
          />
        </div>
      </div>
    </ReactModal>
  );
};

export default IframeModal;
