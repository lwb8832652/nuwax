import SelectionList, {
  type SelectionListItem,
} from '@/components/SelectionList';
import { useWorkspaceLayoutContext } from '@/components/WorkspaceLayout/EmbeddedContext';
import {
  IM_PLATFORM_ICON_MAP,
  IMPlatformEnum,
} from '@/constants/imChannel.constants';
import { dict } from '@/services/i18nRuntime';
import React, { useMemo } from 'react';
import styles from './index.less';

export type PlatformType = IMPlatformEnum | undefined;

interface PlatformListProps {
  value: PlatformType;
  onChange: (value: PlatformType) => void;
  list?: { channel: string; channelName: string; count: number }[];
}

const PlatformList: React.FC<PlatformListProps> = ({
  value,
  onChange,
  list = [],
}) => {
  const { embedded } = useWorkspaceLayoutContext();
  const selectionItems = useMemo<SelectionListItem<PlatformType>[]>(
    () =>
      list.map((item) => ({
        icon: IM_PLATFORM_ICON_MAP[item.channel as IMPlatformEnum],
        label: item.channelName,
        description: dict(
          'PC.Pages.IMChannel.PlatformList.robotCount',
          String(item.count || 0),
        ),
        value: item.channel as IMPlatformEnum,
      })),
    [list],
  );

  if (embedded) {
    return (
      <div className={styles.compactPlatforms}>
        <h4>{dict('PC.Pages.IMChannel.PlatformList.platformList')}</h4>
        <div className={styles.platformItems}>
          {selectionItems.map((item) => (
            <button
              type="button"
              key={item.value}
              aria-pressed={value === item.value}
              className={value === item.value ? styles.active : undefined}
              onClick={() => onChange(item.value)}
            >
              <span className={styles.platformIcon}>
                {typeof item.icon === 'string' && item.icon ? (
                  <img src={item.icon} alt="" />
                ) : (
                  <span>{item.value === IMPlatformEnum.QQ ? 'QQ' : 'IM'}</span>
                )}
              </span>
              <span className={styles.platformInfo}>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SelectionList
      title={dict('PC.Pages.IMChannel.PlatformList.platformList')}
      list={selectionItems}
      value={value}
      onChange={onChange}
    />
  );
};

export default PlatformList;
