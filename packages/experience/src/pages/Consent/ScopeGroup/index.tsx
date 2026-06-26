import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { type Nullable } from '@silverhand/essentials';
import { useState, useCallback } from 'react';

import { onKeyDownHandler } from '@/shared/utils/a11y';

type ScopeGroupProps = {
  readonly groupName: string;
  readonly isAutoExpand?: boolean;
  readonly scopes: Array<{
    id: string;
    name: string;
    description?: Nullable<string>; // Organization scope description cloud be `null`
  }>;
};

const ScopeGroup = ({ groupName, scopes, isAutoExpand = false }: ScopeGroupProps) => {
  const [expanded, setExpanded] = useState(isAutoExpand);

  const toggle = useCallback(() => {
    setExpanded((previous) => !previous);
  }, []);

  return (
    <div className="px-2">
      <div
        className="flex items-center rounded-[11px] p-2 cursor-pointer overlay-hover"
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={onKeyDownHandler(toggle)}
      >
        <CheckIcon className="text-success w-5 h-5 me-2" />
        <div className="text-sm flex-1 min-w-0 truncate me-2" title={groupName}>
          {groupName}
        </div>
        <ChevronDownIcon
          className="transition-transform duration-200 ease-in-out relative w-5 h-5 text-muted data-[expanded=true]:rotate-180"
          data-expanded={expanded}
        />
      </div>
      {expanded && (
        <ul className="ps-8 text-xs text-muted m-0">
          {scopes.map(({ id, name, description }) => (
            <li key={id} className="py-0.5 ps-1 pe-0 mb-1.5">
              {description ?? name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScopeGroup;
