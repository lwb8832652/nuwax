import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useLocation, useModel, useSearchParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 二级菜单收起/展开切换按钮
 * @description 支持三级优先级：用户操作 > URL参数hideMenu > 默认展开
 */
const CollapseButton: React.FC = () => {
  const { isSecondMenuCollapsed, setIsSecondMenuCollapsed } =
    useModel('layout');
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // 生成localStorage的key（基于当前页面路径）
  const getStorageKey = () => {
    return `menu-collapsed-user-preference`;
  };

  // 存储用户操作状态
  const saveUserPreference = (collapsed: boolean) => {
    try {
      const key = getStorageKey();
      const data = {
        collapsed,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // localStorage可能不可用，安静处理
      console.warn('Failed to save menu preference:', error);
    }
  };

  // 读取用户操作状态
  const getUserPreference = () => {
    try {
      const key = getStorageKey();
      const data = sessionStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.collapsed as boolean;
      }
    } catch (error) {
      console.warn('Failed to read menu preference:', error);
    }
    return null;
  };

  // 初始化菜单状态（三级优先级）
  useEffect(() => {
    // 优先级1: 检查用户操作记录
    const userPreference = getUserPreference();
    if (userPreference !== null) {
      setIsSecondMenuCollapsed(userPreference);
      return;
    }

    // 优先级2: 检查URL参数
    const hideMenu = searchParams.get('hideMenu');
    if (hideMenu === 'true') {
      setIsSecondMenuCollapsed(true);
      return;
    }

    // 优先级3: 默认展开（false）
    setIsSecondMenuCollapsed(false);
  }, [searchParams, setIsSecondMenuCollapsed, location.pathname]);

  // 处理点击事件（保存用户操作到localStorage）
  const handleToggleCollapse = () => {
    const newState = !isSecondMenuCollapsed;
    //当用户手动展开时 去除 用户操作标记
    if (!newState) {
      sessionStorage.removeItem(getStorageKey());
    } else {
      // 保存用户操作状态
      saveUserPreference(newState);
    }
    // 更新状态
    setIsSecondMenuCollapsed(newState);
  };

  return (
    <Tooltip
      title={
        isSecondMenuCollapsed
          ? dict('PC.Layouts.DynamicMenusLayout.CollapseButton.expandMenu')
          : dict('PC.Layouts.DynamicMenusLayout.CollapseButton.collapseMenu')
      }
      placement="right"
      arrow={false}
    >
      <button
        type="button"
        aria-label={
          isSecondMenuCollapsed
            ? dict('PC.Layouts.DynamicMenusLayout.CollapseButton.expandMenu')
            : dict('PC.Layouts.DynamicMenusLayout.CollapseButton.collapseMenu')
        }
        aria-expanded={!isSecondMenuCollapsed}
        className={cx(styles['collapse-button'], {
          [styles.collapsed]: isSecondMenuCollapsed,
        })}
        onClick={handleToggleCollapse}
      >
        <SvgIcon
          name="icons-common-caret_left"
          rotate={isSecondMenuCollapsed ? 180 : 0}
          className={cx(styles.icon)}
        />
      </button>
    </Tooltip>
  );
};

export default CollapseButton;
