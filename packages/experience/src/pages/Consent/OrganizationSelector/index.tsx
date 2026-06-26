import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ReservedResource } from '@logto/core-kit';
import classNames from 'classnames';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ScopeGroup from '../ScopeGroup';

import OrganizationItem, { type Organization } from './OrganizationItem';
import OrganizationSelectorModal from './OrganizationSelectorModal';

export { type Organization } from './OrganizationItem';

type Props = {
  readonly organizations: Organization[];
  readonly selectedOrganization: Organization | undefined;
  readonly onSelect: (organization: Organization) => void;
  readonly className?: string;
};

const OrganizationSelector = ({
  organizations,
  selectedOrganization,
  onSelect,
  className,
}: Props) => {
  const { t } = useTranslation();
  const parentElementRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  if (organizations.length === 0 || !selectedOrganization) {
    return null;
  }

  const { missingResourceScopes: resourceScopes } = selectedOrganization;

  return (
    <div className={className}>
      <div className="text-sm font-medium mb-2">
        {t(`description.authorize_organization_access`)}
      </div>
      {resourceScopes && resourceScopes.length > 0 && (
        <div className="border border-line border-b-0 rounded-t-[10px] py-2">
          {resourceScopes
            .slice()
            // Sort the scopes to make sure the organization scope is always on top
            .sort(({ resource: resourceA }, { resource: resourceB }) => {
              if (resourceA.id === ReservedResource.Organization) {
                return -1;
              }
              return resourceB.id === ReservedResource.Organization ? 1 : 0;
            })
            .map(({ resource, scopes }) => (
              <ScopeGroup
                key={resource.id}
                groupName={
                  resource.id === ReservedResource.Organization
                    ? t('description.organization_scopes')
                    : resource.name
                }
                scopes={scopes}
                isAutoExpand={resourceScopes.length === 1}
              />
            ))}
        </div>
      )}
      <div
        ref={parentElementRef}
        className={classNames(
          'border border-line-strong rounded-[13px] p-2 relative data-[active=true]:border-primary data-[active=true]:outline data-[active=true]:outline-[3px] data-[active=true]:outline-[var(--color-overlay-brand-focused)]',
          Boolean(resourceScopes?.length) && 'rounded-t-none rounded-b-[10px]'
        )}
        data-active={showDropdown}
      >
        <OrganizationItem
          className="cursor-pointer overlay-hover"
          organization={selectedOrganization}
          suffixElement={<ChevronDownIcon className="relative w-5 h-5 text-muted" />}
          onSelect={() => {
            setShowDropdown(true);
          }}
        />
      </div>
      <OrganizationSelectorModal
        isOpen={showDropdown}
        parentElementRef={parentElementRef}
        organizations={organizations}
        selectedOrganization={selectedOrganization}
        onSelect={onSelect}
        onClose={() => {
          setShowDropdown(false);
        }}
      />
    </div>
  );
};

export default OrganizationSelector;
