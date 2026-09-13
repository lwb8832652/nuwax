import { SvgIcon } from '@/components/base';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation, useModel } from 'umi';
import DynamicSecondMenu from '../DynamicSecondMenu';
import type { NewxNavigationEntry, NewxNavigationGroup } from '../navigation';
import TabItem from './TabItem';
import styles from './index.less';

export interface DynamicTabsProps {
  collapsed?: boolean;
  groups: NewxNavigationGroup[];
  activeKeys: Set<string>;
  layoutStyle: string;
  navigationStyle: string;
  onClick: (entry: NewxNavigationEntry) => void;
}

/** 资源组使用同一层级的弹出导航，不再挂载工作空间二级侧栏。 */
const DynamicTabs: React.FC<DynamicTabsProps> = ({
  collapsed = false,
  groups,
  activeKeys,
  layoutStyle,
  navigationStyle,
  onClick,
}) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const location = useLocation();
  useEffect(() => {
    setOpenGroup(null);
  }, [location.pathname, location.search]);
  const { handleShowHoverMenu, handleHideHoverMenu } = useModel('layout');

  return (
    <nav className={styles['tabs-list']}>
      {groups.map((group) => {
        const isGroup = !!group.treeCode || group.entries.length > 1;
        const active = group.entries.some((entry) => activeKeys.has(entry.key));
        const trigger = (
          <TabItem
            icon={group.icon}
            text={group.label}
            active={active}
            hasChildren={isGroup}
            isSecondMenuCollapsed={collapsed}
            onClick={() => {
              if (isGroup)
                setOpenGroup(openGroup === group.key ? null : group.key);
              else onClick(group.entries[0]);
            }}
            onMouseEnter={() => {
              if (collapsed && group.key === 'main')
                handleShowHoverMenu('homepage');
            }}
            onMouseLeave={handleHideHoverMenu}
          />
        );
        if (!isGroup)
          return <React.Fragment key={group.key}>{trigger}</React.Fragment>;
        return (
          <Popover
            key={group.key}
            open={openGroup === group.key}
            onOpenChange={(open) => setOpenGroup(open ? group.key : null)}
            trigger="click"
            placement="rightTop"
            arrow={false}
            styles={{ body: { padding: 0 } }}
            content={
              <div
                className={styles.flyout}
                data-nav-theme={layoutStyle}
                data-nav-style={navigationStyle}
              >
                <div className={styles['flyout-title']}>{group.label}</div>
                {group.treeCode ? (
                  <>
                    {group.entries[0].menu.path &&
                      !['/system', '#'].includes(
                        group.entries[0].menu.path,
                      ) && (
                        <button
                          type="button"
                          className={styles['flyout-entry']}
                          onClick={() => {
                            setOpenGroup(null);
                            onClick(group.entries[0]);
                          }}
                        >
                          {group.entries[0].label}
                        </button>
                      )}
                    <DynamicSecondMenu
                      parentCode={group.treeCode}
                      menus={group.entries[0].menu.children}
                    />
                  </>
                ) : (
                  group.entries.map((entry) => (
                    <button
                      type="button"
                      key={entry.key}
                      className={classNames(styles['flyout-entry'], {
                        [styles.active]: activeKeys.has(entry.key),
                      })}
                      onClick={() => {
                        setOpenGroup(null);
                        onClick(entry);
                      }}
                      aria-current={
                        activeKeys.has(entry.key) ? 'page' : undefined
                      }
                    >
                      <SvgIcon name={entry.icon} />
                      <span>{entry.label}</span>
                    </button>
                  ))
                )}
              </div>
            }
          >
            <div className={styles['group-trigger']}>{trigger}</div>
          </Popover>
        );
      })}
    </nav>
  );
};

export default DynamicTabs;
