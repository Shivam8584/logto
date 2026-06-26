import { useState, useCallback, useLayoutEffect } from 'react';
import ReactModal from 'react-modal';

import usePlatform from '@/hooks/use-platform';

import OrganizationItem from '../OrganizationItem';
import { type Organization } from '../OrganizationItem';

type Props = {
  readonly isOpen: boolean;
  readonly parentElementRef: React.RefObject<HTMLDivElement>;
  readonly organizations: Organization[];
  readonly selectedOrganization: Organization;
  readonly onSelect: (organization: Organization) => void;
  readonly onClose: () => void;
};

const OrganizationSelectorModal = ({
  isOpen,
  parentElementRef,
  organizations,
  selectedOrganization,
  onSelect,
  onClose,
}: Props) => {
  const { isMobile } = usePlatform();
  const [position, setPosition] = useState({});

  const updatePosition = useCallback(() => {
    const parent = parentElementRef.current;

    if (!parent || isMobile || !isOpen) {
      setPosition({});
      return;
    }

    const { top, left, height, width } = parent.getBoundingClientRect();

    // Offset the modal from the parent element
    const offset = 8;

    // Measure the actual rendered item height rather than hardcoding 40px, so the
    // position calculation stays correct when padding/font-size changes.
    const firstItem = document.querySelector(`[data-organization-item]`);
    const organizationItemHeight =
      (firstItem instanceof HTMLElement ? firstItem.offsetHeight : undefined) ?? 40;
    // The padding around the modal content
    const organizationModalPadding = 8;

    const windowHeight = window.innerHeight;

    // Cap the dropdown so a long org list can't grow past the viewport. The inner
    // content scrolls (see `max-h`/`overflow-y-auto` below) once it exceeds this.
    const naturalHeight =
      organizations.length * organizationItemHeight + organizationModalPadding * 2;
    const maxModalHeight = windowHeight * 0.6;
    const modalContentHeight = Math.min(naturalHeight, maxModalHeight);

    // Prefer opening below the trigger, but clamp so the modal never runs off the
    // top of the screen (which previously made the upper items unreachable).
    const desiredTop = top + height + offset;
    const maxTop = windowHeight - modalContentHeight - offset;
    const clampedTop = Math.max(offset, Math.min(desiredTop, maxTop));

    setPosition({ top: clampedTop, left, width, maxHeight: modalContentHeight });
  }, [isMobile, isOpen, organizations.length, parentElementRef]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition, isOpen]);

  return (
    <ReactModal
      isOpen={isOpen}
      overlayClassName="bg-transparent fixed inset-0 z-40 mobile:bg-[var(--color-bg-mask)]"
      className="border border-line shadow-[var(--sh-float)] rounded-[13px] bg-elevated absolute z-50 mobile:border-0 mobile:border-t mobile:border-line mobile:shadow-none mobile:rounded-b-none mobile:bottom-0 mobile:w-full mobile:min-h-[200px] mobile:pb-[env(safe-area-inset-bottom)] mobile:translate-y-full mobile:transition-transform mobile:duration-200 mobile:ease-in-out mobile:[&.ReactModal__Content--after-open]:translate-y-0 mobile:[&.ReactModal__Content--before-close]:translate-y-full"
      style={{
        content: {
          ...position,
        },
      }}
      closeTimeoutMS={isMobile ? 300 : 0}
      onRequestClose={onClose}
    >
      <div className="p-2 max-h-[inherit] overflow-y-auto mobile:max-h-[60vh] mobile:px-1 mobile:py-3">
        {organizations.map((organization) => (
          <OrganizationItem
            key={organization.id}
            className="mobile:p-3"
            organization={organization}
            isSelected={organization.id === selectedOrganization.id}
            onSelect={() => {
              onClose();
              onSelect(organization);
            }}
          />
        ))}
      </div>
    </ReactModal>
  );
};

export default OrganizationSelectorModal;
