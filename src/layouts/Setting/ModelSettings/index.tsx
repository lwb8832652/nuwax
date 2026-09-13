import SpaceModelManage from '@/pages/SpaceResource/ModelManage';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { Empty } from 'antd';
import React from 'react';
import styles from '../index.less';
import { canManageModelsInSpace } from '../settingsNavigation';

interface ModelSettingsProps {
  menus: MenuItemDto[];
  space?: SpaceInfo;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ menus, space }) => {
  const effectiveSpaceId = canManageModelsInSpace(menus, space)
    ? space?.id
    : undefined;

  return (
    <div className={styles.modelSettings}>
      <div className={styles.modelContent}>
        {effectiveSpaceId ? (
          <SpaceModelManage
            key={effectiveSpaceId}
            spaceId={effectiveSpaceId}
            embedded
          />
        ) : (
          <Empty description={dict('PC.Pages.Setting.noAvailableSpace')} />
        )}
      </div>
    </div>
  );
};

export default ModelSettings;
