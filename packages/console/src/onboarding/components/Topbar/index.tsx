import CloudLogo from '@/assets/images/cloud-logo.svg?react';
import Logo from '@/assets/images/logo.svg?react';
import { isCloud } from '@/consts/env';

import styles from './index.module.scss';

function Topbar() {
  const LogtoLogo = isCloud ? CloudLogo : Logo;

  return (
    <div className={styles.topbar}>
      <LogtoLogo className={styles.logo} />
    </div>
  );
}

export default Topbar;
