import IMChannel from '@/pages/IMChannel';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { Empty } from 'antd';
import React from 'react';
import styles from '../index.less';
import { canUseIMSpace } from '../settingsNavigation';

interface IMBotSettingsProps {
  menus: MenuItemDto[];
  space?: SpaceInfo;
}

const IMBotSettings: React.FC<IMBotSettingsProps> = ({ menus, space }) => {
  const effectiveSpaceId =
    space && canUseIMSpace(menus, space.id) ? space.id : undefined;

  return (
    <div className={styles.imSettings}>
      <div className={styles.imContent}>
        {effectiveSpaceId ? (
          <IMChannel key={effectiveSpaceId} spaceId={effectiveSpaceId} />
        ) : (
          <Empty description={dict('PC.Pages.Setting.noAvailableSpace')} />
        )}
      </div>
    </div>
  );
};

export default IMBotSettings;
