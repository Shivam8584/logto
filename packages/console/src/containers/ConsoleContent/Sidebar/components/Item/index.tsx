import classNames from 'classnames';
import type { TFuncKey } from 'i18next';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import useTenantPathname from '@/hooks/use-tenant-pathname';

import { getPath } from '../../utils';

import styles from './index.module.scss';

type Props = {
  readonly icon?: ReactNode;
  readonly titleKey: TFuncKey<'translation', 'admin_console.tabs'>;
  readonly isActive?: boolean;
  readonly modal?: (isOpen: boolean, onCancel: () => void) => ReactNode;
  readonly externalLink?: string;
  readonly path?: string;
};

function Item({ icon, titleKey, modal, externalLink, path, isActive = false }: Props) {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'admin_console.tabs',
  });
  const { getTo } = useTenantPathname();
  const [isOpen, setIsOpen] = useState(false);

  const content = useMemo(
    () => (
      <>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.title}>{t(titleKey)}</div>
      </>
    ),
    [icon, t, titleKey]
  );

  if (modal) {
    return (
      <>
        <button
          className={styles.row}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          {content}
        </button>
        {modal(isOpen, () => {
          setIsOpen(false);
        })}
      </>
    );
  }

  if (externalLink) {
    return (
      <a href={externalLink} target="_blank" className={styles.row} rel="noopener">
        {content}
      </a>
    );
  }

  // react-router-dom v7 resolves a RELATIVE `to` (e.g. "sign-in-experience") against the
  // CURRENT location, not the route — so clicking sidebar items APPENDED segments and
  // compounded into ".../sign-in-experience/sign-in-experience/mfa/..." → "Page not found"
  // (this worked under v6's route-relative resolution). Make the target absolute and
  // tenant-aware via getTo(), exactly like TabNavItem, so every click navigates to the
  // tenant-rooted page regardless of where the user currently is.
  const relativePath = path ?? getPath(titleKey);
  const to = getTo(relativePath.startsWith('/') ? relativePath : `/${relativePath}`);

  return (
    <Link to={to} className={classNames(styles.row, isActive && styles.active)}>
      {content}
    </Link>
  );
}

export default Item;
