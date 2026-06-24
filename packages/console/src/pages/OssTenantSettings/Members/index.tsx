import MembersBg from '@/assets/icons/members-bg.svg?url';
import { LinkButton } from '@/ds-components/Button';
import Card from '@/ds-components/Card';
import DynamicT from '@/ds-components/DynamicT';

import { getOssTenantMembersUpsellCopyKeys } from '../utils';

import styles from './index.module.scss';

// Hypedrive self-hosted — there is no Cloud "invite collaborator" backend, so instead of a
// dead upsell we point admins at the native multi-admin path: create users and assign them an
// admin role on the Users page. That is how self-hosted Logto supports multiple administrators.
function Members() {
  const copyKeys = getOssTenantMembersUpsellCopyKeys();

  return (
    <Card className={styles.card}>
      <div className={styles.content}>
        <img alt="" className={styles.image} src={MembersBg} />
        <div className={styles.textContent}>
          <div className={styles.title}>
            <DynamicT forKey={copyKeys.title} />
          </div>
          <div className={styles.description}>
            <DynamicT forKey={copyKeys.description} />
          </div>
        </div>
        <LinkButton
          className={styles.action}
          type="primary"
          title={copyKeys.action}
          href="/users"
        />
      </div>
    </Card>
  );
}

export default Members;
