import { WorkspaceLayoutContext } from '@/components/WorkspaceLayout/EmbeddedContext';
import ApiKeyPage from '@/pages/MorePage/ApiKey';
import MyComputerManage from '@/pages/MyComputerManage';
import { dict } from '@/services/i18nRuntime';
import { getTenantThemeConfig } from '@/services/tenant';
import { SettingActionEnum } from '@/types/enums/menus';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { TenantThemeConfig } from '@/types/tenant';
import {
  ApiOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  CloseOutlined,
  CodeOutlined,
  DeploymentUnitOutlined,
  DesktopOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LockOutlined,
  MoreOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import {
  handleOpenUrl,
  isHttpMenuPath,
  isOpenIframePath,
  navigateOpenIframePath,
  updatePathUrlToLocalStorage,
} from '../DynamicMenusLayout/utils';
import DeveloperProfile from './DeveloperProfile';
import IMBotSettings from './IMBotSettings';
import styles from './index.less';
import LanguageSwitchPanel from './LanguageSwitchPanel';
import ModelSettings from './ModelSettings';
import ResetPassword from './ResetPassword';
import SettingAccount from './SettingAccount';
import SettingEmail from './SettingEmail';
import {
  canManageModelsInSpace,
  canUseIMSpace,
  getCurrentSettingsSpace,
  getEnabledSettingsMenus,
  getMoreSettingsMenus,
  isApiKeySettingsMenu,
  isComputerSettingsMenu,
  isIMSettingsMenu,
  isSpaceModelSettingsMenu,
} from './settingsNavigation';
import SystemVersionPanel from './SystemVersionPanel';
import ThemeSwitchPanel from './ThemeSwitchPanel';
import UsageStatistics from './UsageStatistics';

const cx = classNames.bind(styles);

type SettingsAction =
  | SettingActionEnum
  | 'computer'
  | 'models'
  | 'apiKeys'
  | 'imBots';
interface SettingsNavItem {
  type: SettingsAction;
  icon: React.ReactNode;
}

const Setting: React.FC = () => {
  const { openSetting, setOpenSetting, isMobile } = useModel('layout');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { menuTree } = useModel('menuModel');
  const { currentSpaceInfo, getSpaceId, spaceList } = useModel('spaceModel');
  const location = useLocation();
  const params = useParams();
  const enabledMenus = useMemo(
    () => getEnabledSettingsMenus(menuTree),
    [menuTree],
  );
  const moreMenus = useMemo(() => getMoreSettingsMenus(menuTree), [menuTree]);
  const hasComputers = enabledMenus.some(isComputerSettingsMenu);
  const hasApiKeys = enabledMenus.some(isApiKeySettingsMenu);
  const modelMenus = useMemo(
    () => enabledMenus.filter(isSpaceModelSettingsMenu),
    [enabledMenus],
  );
  const settingsSpace = getCurrentSettingsSpace(
    spaceList,
    currentSpaceInfo,
    params.spaceId,
    getSpaceId(),
  );
  const canManageModels = canManageModelsInSpace(modelMenus, settingsSpace);
  const imMenus = useMemo(
    () => enabledMenus.filter(isIMSettingsMenu),
    [enabledMenus],
  );
  const canManageIMBots =
    !!settingsSpace && canUseIMSpace(imMenus, settingsSpace.id);
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;
  const [action, setAction] = useState<SettingsAction>(
    SettingActionEnum.Account,
  );
  const [tenantThemeConfig, setTenantThemeConfig] =
    useState<TenantThemeConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Route actions inside embedded pages (such as API call logs) retain their
  // original navigation and dismiss this overlay to expose the destination.
  useEffect(() => {
    setOpenSetting(false);
  }, [location.pathname, location.search]);

  const activeAction: SettingsAction =
    (action === 'computer' && !hasComputers) ||
    (action === 'models' && !canManageModels) ||
    (action === 'apiKeys' && !hasApiKeys) ||
    (action === 'imBots' && !canManageIMBots) ||
    (action === SettingActionEnum.Developer_Profile && !isEnableSubscription)
      ? SettingActionEnum.Account
      : action;

  const navItems: SettingsNavItem[] = [
    { type: SettingActionEnum.Account, icon: <UserOutlined /> },
    { type: SettingActionEnum.Email_Bind, icon: <LinkOutlined /> },
    { type: SettingActionEnum.Reset_Password, icon: <LockOutlined /> },
    ...(hasComputers
      ? [{ type: 'computer' as const, icon: <DesktopOutlined /> }]
      : []),
    ...(canManageModels
      ? [{ type: 'models' as const, icon: <DeploymentUnitOutlined /> }]
      : []),
    { type: SettingActionEnum.Theme_Switch, icon: <BgColorsOutlined /> },
    { type: SettingActionEnum.Language_Switch, icon: <GlobalOutlined /> },
    { type: SettingActionEnum.Usage_Statistics, icon: <BarChartOutlined /> },
    ...(hasApiKeys
      ? [{ type: 'apiKeys' as const, icon: <ApiOutlined /> }]
      : []),
    ...(canManageIMBots
      ? [{ type: 'imBots' as const, icon: <RobotOutlined /> }]
      : []),
    ...(isEnableSubscription
      ? [{ type: SettingActionEnum.Developer_Profile, icon: <CodeOutlined /> }]
      : []),
    { type: SettingActionEnum.System_Version, icon: <InfoCircleOutlined /> },
  ];

  // 获取租户主题配置
  useEffect(() => {
    const fetchTenantThemeConfig = async () => {
      if (action === SettingActionEnum.Theme_Switch && !tenantThemeConfig) {
        setLoading(true);
        try {
          const config = await getTenantThemeConfig();
          setTenantThemeConfig(config);
        } catch (error) {
          console.error('Failed to load tenant theme config:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTenantThemeConfig();
  }, [action, tenantThemeConfig]);

  const handlerClick = (type: SettingsAction) => {
    setAction(type);
  };

  /** 渲染内容 */
  const renderContent = () => {
    switch (activeAction) {
      case 'computer':
        return <MyComputerManage />;
      case 'models':
        return <ModelSettings menus={modelMenus} space={settingsSpace} />;
      case 'apiKeys':
        return <ApiKeyPage />;
      case 'imBots':
        return <IMBotSettings menus={imMenus} space={settingsSpace} />;
      case SettingActionEnum.Account:
        return <SettingAccount />;
      case SettingActionEnum.Email_Bind:
        return <SettingEmail />;
      case SettingActionEnum.Reset_Password:
        return <ResetPassword />;
      case SettingActionEnum.Theme_Switch:
        if (loading) {
          return (
            <div className={cx(styles.loading)}>
              {dict('PC.Common.Global.loading')}
            </div>
          );
        }
        if (!tenantThemeConfig) {
          return (
            <div className={cx(styles.error)}>
              {dict('PC.Pages.Setting.themeLoadFailed')}
            </div>
          );
        }
        return <ThemeSwitchPanel tenantThemeConfig={tenantThemeConfig} />;
      case SettingActionEnum.Language_Switch:
        return <LanguageSwitchPanel />;
      case SettingActionEnum.Usage_Statistics:
        return <UsageStatistics />;
      case SettingActionEnum.Developer_Profile:
        return <DeveloperProfile />;
      case SettingActionEnum.System_Version:
        return <SystemVersionPanel version={tenantConfigInfo?.version} />;
      default:
        return <SettingAccount />;
    }
  };

  // 获取当前登录方式是否为手机登录,如果是手机登录,则为true,否则为false
  const authType = localStorage.getItem('AUTH_TYPE') === '1';

  /** 获取操作标签 */
  const getActionLabel = (type: SettingsAction) => {
    switch (type) {
      case 'computer':
        return dict('PC.Pages.Setting.myComputer');
      case 'models':
        return dict('PC.Pages.SpaceModelManage.pageTitle');
      case 'apiKeys':
        return dict('PC.Pages.Setting.apiKeys');
      case 'imBots':
        return dict('PC.Pages.Setting.imBots');
      case SettingActionEnum.Account:
        return dict('PC.Pages.Setting.accountTitle');
      case SettingActionEnum.Email_Bind:
        return authType
          ? dict('PC.Pages.Setting.emailBind')
          : dict('PC.Pages.Setting.phoneBind');
      case SettingActionEnum.Reset_Password:
        return dict('PC.Pages.Setting.resetPassword');
      case SettingActionEnum.Theme_Switch:
        return dict('PC.Pages.Setting.themeSwitch');
      case SettingActionEnum.Language_Switch:
        return dict('PC.Pages.Setting.language');
      case SettingActionEnum.Usage_Statistics:
        return dict('PC.Pages.Setting.usageStatistics');
      case SettingActionEnum.Developer_Profile:
        return dict('PC.Pages.Setting.DeveloperProfile.title');

      /** 系统版本 */
      case SettingActionEnum.System_Version:
        return dict('PC.Constants.Menus.systemVersion');
      /** 默认返回空字符串 */
      default:
        return '';
    }
  };
  const handleMoreMenu = (menu: MenuItemDto) => {
    if (isHttpMenuPath(menu.path || '')) {
      handleOpenUrl(menu, 'more_page');
      setOpenSetting(false);
      return;
    }

    const spaceId = params.spaceId || getSpaceId();
    const targetPath = (menu.path || '').replace(
      /:spaceId/g,
      String(spaceId || ''),
    );
    if (!targetPath || /:[A-Za-z]/.test(targetPath)) {
      message.warning(
        dict(
          'PC.Layouts.DynamicMenusLayout.DynamicSecondMenu.pathResolveFailed',
        ),
      );
      return;
    }
    updatePathUrlToLocalStorage('more_page', targetPath);
    setOpenSetting(false);
    if (isOpenIframePath(targetPath)) {
      navigateOpenIframePath(targetPath, { menuCode: menu.code });
    } else {
      history.push(targetPath, { _t: Date.now(), menuCode: menu.code });
    }
  };
  const embedded = typeof activeAction === 'string';

  return (
    <Modal
      centered
      open={openSetting}
      footer={null}
      onCancel={() => setOpenSetting(false)}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div
          className={cx(styles.container, 'flex', 'overflow-hide', {
            [styles['container-mobile']]: isMobile,
          })}
        >
          <nav
            className={cx(styles.left)}
            aria-label={dict('PC.Pages.Setting.title')}
          >
            <h3>{dict('PC.Pages.Setting.title')}</h3>
            <div
              className={styles.navList}
              role="tablist"
              aria-orientation="vertical"
            >
              {navItems.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeAction === item.type}
                  aria-controls="settings-content"
                  key={item.type}
                  className={cx(styles.item, {
                    [styles.checked]: activeAction === item.type,
                  })}
                  onClick={() => handlerClick(item.type)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{getActionLabel(item.type)}</span>
                </button>
              ))}
            </div>
            {!!moreMenus.length && (
              <div className={styles.moreGroup}>
                <h4>{dict('PC.Pages.Setting.moreSettings')}</h4>
                {moreMenus.map((menu) => (
                  <button
                    type="button"
                    key={menu.id}
                    className={styles.item}
                    onClick={() => handleMoreMenu(menu)}
                  >
                    <span className={styles.navIcon}>
                      <MoreOutlined />
                    </span>
                    <span>{menu.name}</span>
                  </button>
                ))}
              </div>
            )}
          </nav>
          <Button
            type="text"
            aria-label={dict('PC.Common.Global.close')}
            className={cx(styles.close, 'cursor-pointer')}
            icon={<CloseOutlined />}
            onClick={() => setOpenSetting(false)}
          />
          <div
            id="settings-content"
            role="tabpanel"
            aria-label={getActionLabel(activeAction)}
            className={cx('flex-1', styles.right, {
              [styles.embeddedContent]: embedded,
            })}
          >
            <WorkspaceLayoutContext.Provider
              value={{
                embedded,
                title: embedded ? getActionLabel(activeAction) : undefined,
              }}
            >
              {renderContent()}
            </WorkspaceLayoutContext.Provider>
          </div>
        </div>
      )}
    />
  );
};

export default Setting;
