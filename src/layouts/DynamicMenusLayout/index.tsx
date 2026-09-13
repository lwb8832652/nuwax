import { SUCCESS_CODE } from '@/constants/codes.constants';
import { SPACE_ID } from '@/constants/home.constants';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import {
  MENU_CODE_DOCUMENTS,
  MENU_CODE_NOTIFICATION,
} from '@/constants/menus.constants';
import useConversation from '@/hooks/useConversation';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { apiGetSpaceDetail } from '@/services/teamSetting';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum } from '@/types/enums/space';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import CollapseButton from './CollapseButton';
import DynamicTabs from './DynamicTabs';
import Header from './Header';
import NewHomeSection from './NewHomeSection';
import SpaceTitle from './SpaceSection/SpaceTitle';
import User from './User';
import UserAvatar from './User/UserAvatar';
import UserOperateArea from './UserOperateArea';
import styles from './index.less';
import {
  buildNewxNavigation,
  isNewxNavigationEntryActive,
  resolveNewxNavigationPath,
  type NewxNavigationEntry,
} from './navigation';
import {
  handleOpenUrl,
  isHttpMenuPath,
  isOpenIframePath,
  navigateOpenIframePath,
  normalizeMenuPathname,
  updatePathUrlToLocalStorage,
} from './utils';

export interface DynamicMenusLayoutProps {
  overrideContainerStyle?: React.CSSProperties;
  isMobile?: boolean;
}

/** 使用原后端授权树与业务路由，按 NewX 的资源类型组织导航。 */
const DynamicMenusLayout: React.FC<DynamicMenusLayoutProps> = ({
  overrideContainerStyle,
  isMobile = false,
}) => {
  const location = useLocation();
  const params = useParams();
  const { navigationStyle, layoutStyle, language } = useUnifiedTheme();
  const {
    isSecondMenuCollapsed,
    setOpenMessage,
    setOpenAdmin,
    handleCloseMobileMenu,
  } = useModel('layout');
  const { firstLevelMenus, otherMenus } = useModel('menuModel');
  const { refreshUserInfo, userInfo } = useModel('userInfo');
  const { currentSpaceInfo, spaceList, handleCurrentSpaceInfo, getSpaceId } =
    useModel('spaceModel');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { handleCreateConversation } = useConversation();
  const [spaceTitle, setSpaceTitle] = useState('');

  useEffect(() => {
    refreshUserInfo();
  }, []);

  // 原空间标题/路由同步逻辑上移；资源页不再依赖旧二级栏挂载。
  useEffect(() => {
    const routeSpaceId = params.spaceId;
    if (!routeSpaceId || !spaceList.length) {
      setSpaceTitle('');
      return;
    }
    handleCurrentSpaceInfo(spaceList, Number(routeSpaceId));
    localStorage.setItem(SPACE_ID, routeSpaceId);
    const selectedSpace = spaceList.find(
      (space: SpaceInfo) => space.id === Number(routeSpaceId),
    );
    if (selectedSpace) {
      setSpaceTitle(selectedSpace.name);
      return;
    }
    let cancelled = false;
    apiGetSpaceDetail(routeSpaceId).then((result) => {
      if (cancelled || result.code !== SUCCESS_CODE || !result.data) return;
      const { name, creatorName, currentUserRole } = result.data;
      setSpaceTitle(
        currentUserRole !== 'Owner' && creatorName
          ? `${creatorName} - ${name}`
          : name,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [params.spaceId, spaceList, handleCurrentSpaceInfo]);

  const selectedSpaceId =
    params.spaceId || currentSpaceInfo?.id || getSpaceId();
  const groups = useMemo(
    () =>
      buildNewxNavigation(firstLevelMenus, {
        isOrdinaryMember: currentSpaceInfo?.currentUserRole === RoleEnum.User,
        allowDevelop:
          currentSpaceInfo?.allowDevelop !== AllowDevelopEnum.Not_Allow,
        enableSubscription: tenantConfigInfo?.enableSubscription !== 0,
        english: language === 'en-US',
      }),
    [
      firstLevelMenus,
      currentSpaceInfo,
      tenantConfigInfo?.enableSubscription,
      language,
    ],
  );

  const activeKeys = useMemo(() => {
    const keys = new Set<string>();
    const pathname = normalizeMenuPathname(location.pathname);
    groups.forEach((group) =>
      group.entries.forEach((entry) => {
        if (
          isNewxNavigationEntryActive(
            entry,
            pathname,
            location.search,
            selectedSpaceId,
            params,
          ) ||
          (group.treeCode &&
            (location.state?.menuCode === group.treeCode ||
              entry.menu.children?.some(
                (child) =>
                  child.path && pathname.startsWith(child.path.split('?')[0]),
              )))
        )
          keys.add(entry.key);
      }),
    );
    return keys;
  }, [groups, location, selectedSpaceId, params]);

  const handleNavigation = (entry: NewxNavigationEntry) => {
    const { menu, parentCode } = entry;
    handleCloseMobileMenu();
    if (menu.code === 'new_conversation' && !menu.path) {
      if (tenantConfigInfo?.defaultAgentId)
        handleCreateConversation(tenantConfigInfo.defaultAgentId);
      return;
    }
    const path = resolveNewxNavigationPath(
      menu.path || '',
      selectedSpaceId,
      params,
    );
    if (!path) {
      message.warning(
        dict(
          'PC.Layouts.DynamicMenusLayout.DynamicSecondMenu.pathResolveFailed',
        ),
      );
      return;
    }
    if (isHttpMenuPath(path)) {
      handleOpenUrl({ ...menu, path }, parentCode);
      return;
    }
    updatePathUrlToLocalStorage(parentCode, path);
    if (isOpenIframePath(path)) {
      navigateOpenIframePath(path, { menuCode: menu.code });
      return;
    }
    history.push(path, { _t: Date.now(), menuCode: menu.code });
  };

  const handleUtility = (menu: MenuItemDto) => {
    if (menu.code === MENU_CODE_DOCUMENTS) handleOpenUrl(menu);
    if (menu.code === MENU_CODE_NOTIFICATION) setOpenMessage(true);
  };
  const utilityMenus = otherMenus
    .filter((menu: MenuItemDto) =>
      [MENU_CODE_DOCUMENTS, MENU_CODE_NOTIFICATION].includes(menu.code || ''),
    )
    .sort(
      (a: MenuItemDto, b: MenuItemDto) =>
        Number(a.code === MENU_CODE_NOTIFICATION) -
        Number(b.code === MENU_CODE_NOTIFICATION),
    );
  const isCollapsed = isSecondMenuCollapsed && !isMobile;
  const showHistory = groups.some((group) => group.key === 'main');
  const workspaceName =
    spaceTitle ||
    currentSpaceInfo?.name ||
    dict('PC.Layouts.DynamicMenusLayout.SpaceSection.personalSpace');
  const userName =
    userInfo?.nickName ||
    userInfo?.userName ||
    dict('PC.Components.UserMenu.defaultUserName');

  return (
    <aside
      className={classNames(
        styles.container,
        `xagi-layout-${layoutStyle}`,
        `xagi-nav-${navigationStyle}`,
        isCollapsed && styles.collapsed,
        isMobile && styles['mobile-container'],
      )}
      data-nav-theme={layoutStyle}
      data-nav-style={navigationStyle}
      style={{
        width: isCollapsed
          ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1
          : NAVIGATION_LAYOUT_SIZES.getTotalMenuWidth(navigationStyle),
      }}
    >
      <div className={styles['brand-row']}>
        <Header collapsed={isCollapsed} />
        <CollapseButton />
      </div>
      <div className={styles['workspace-switch']}>
        <SpaceTitle name={workspaceName} collapsed={isCollapsed} />
      </div>
      <div className={styles['primary-navigation']}>
        <DynamicTabs
          collapsed={isCollapsed}
          groups={groups}
          activeKeys={activeKeys}
          layoutStyle={layoutStyle}
          navigationStyle={navigationStyle}
          onClick={handleNavigation}
        />
      </div>
      {showHistory && (
        <section className={styles['nav-menus']} hidden={isCollapsed}>
          <div className={styles['menu-title']}>
            {dict(
              'PC.Layouts.DynamicMenusLayout.HomeSection.conversationHistory',
            )}
          </div>
          <div
            className={classNames(
              styles['nav-menus-scroll'],
              styles['history-scroll'],
            )}
          >
            <NewHomeSection style={overrideContainerStyle} />
          </div>
        </section>
      )}
      <div className={styles['sidebar-footer']}>
        <div className={styles['account-navigation']}>
          <User placement="rightBottom">
            <button
              type="button"
              className={styles['account-button']}
              aria-label={userName}
            >
              <UserAvatar
                avatar={userInfo?.avatar}
                onClick={() => setOpenAdmin(true)}
              />
              {!isCollapsed && (
                <span className={styles['account-copy']}>
                  <strong>{userName}</strong>
                </span>
              )}
            </button>
          </User>
        </div>
        <div className={styles['utility-navigation']}>
          <UserOperateArea onClick={handleUtility} menus={utilityMenus} />
        </div>
      </div>
    </aside>
  );
};

export default DynamicMenusLayout;
