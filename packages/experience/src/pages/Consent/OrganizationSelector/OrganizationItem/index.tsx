import { CheckIcon } from '@heroicons/react/24/outline';
import { type ConsentInfoResponse } from '@logto/schemas';
import classNames from 'classnames';
import { type ReactNode } from 'react';

import OrganizationIcon from '@/assets/icons/organization-icon.svg?react';
import { onKeyDownHandler } from '@/shared/utils/a11y';

export type Organization = Exclude<ConsentInfoResponse['organizations'], undefined>[number];

type OrganizationItemProps = {
  readonly className?: string;
  readonly organization: Organization;
  readonly onSelect?: (organization: Organization) => void;
  readonly isSelected?: boolean;
  readonly suffixElement?: ReactNode;
};

const OrganizationItem = ({
  organization,
  onSelect,
  isSelected,
  suffixElement,
  className,
}: OrganizationItemProps) => {
  return (
    <div
      data-organization-item
      className={classNames(
        'group rounded-[11px] py-2.5 px-2 cursor-pointer flex items-center overlay-hover data-[selected=true]:text-primary',
        className
      )}
      data-selected={isSelected}
      {...(onSelect && {
        role: 'button',
        tabIndex: 0,
        onClick: () => {
          onSelect(organization);
        },
        onKeyDown: onKeyDownHandler(() => {
          onSelect(organization);
        }),
      })}
    >
      {isSelected ? (
        <CheckIcon className="w-5 h-5 text-muted me-2 group-data-[selected=true]:text-primary" />
      ) : (
        <OrganizationIcon className="w-5 h-5 text-muted me-2 group-data-[selected=true]:text-primary" />
      )}
      <div className="text-sm flex-1 min-w-0 truncate" title={organization.name}>
        {organization.name}
      </div>
      {suffixElement}
    </div>
  );
};

export default OrganizationItem;
