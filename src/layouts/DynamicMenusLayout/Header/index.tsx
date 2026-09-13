import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const Header: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const brandName = tenantConfigInfo?.siteName || 'NewX';

  return (
    <div className={styles.wordmark} title={brandName}>
      {tenantConfigInfo?.siteLogo ? (
        <img src={tenantConfigInfo.siteLogo} className={styles.logo} alt="" />
      ) : (
        <span className={styles.mark} aria-hidden="true">
          ✳
        </span>
      )}
      {!collapsed && (
        <>
          <span className={styles.name}>{brandName}</span>
          <span className={styles.tag}>AI</span>
        </>
      )}
    </div>
  );
};

export default Header;
