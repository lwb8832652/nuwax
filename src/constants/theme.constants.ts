/**
 * 主题配置常量
 * 定义布局风格和导航风格的所有CSS变量配置
 */

import { dict } from '@/services/i18nRuntime';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import {
  ThemeBackgroundConfig,
  ThemeStyleConfig,
} from '@/types/interfaces/theme';
// 主题令牌常量配置
// 为主题配置添加类型
import type { ThemeConfig } from 'antd';
import type { AliasToken } from 'antd/es/theme/interface';
import { FIRST_MENU_WIDTH_STYLE2 } from './layout.constants';

/**
 * 预设主题色配置
 * 定义可选择的主题色选项
 */
export const THEME_COLOR_CONFIGS = [
  {
    color: '#5e6ad2',
    name: dict('PC.Constants.Theme.colorBlue'),
    isDefault: true,
  },
  { color: '#ff4d4f', name: dict('PC.Constants.Theme.colorRed') },
  { color: '#fa8c16', name: dict('PC.Constants.Theme.colorOrange') },
  { color: '#52c41a', name: dict('PC.Constants.Theme.colorGreen') },
  { color: '#722ed1', name: dict('PC.Constants.Theme.colorPurple') },
  { color: '#eb2f96', name: dict('PC.Constants.Theme.colorPink') },
] as const;

/**
 * 本地存储键名配置
 * 统一管理所有存储键名，确保各模块间的一致性
 */
export const STORAGE_KEYS = {
  LAYOUT_STYLE: 'xagi-layout-style', // 布局样式配置
  BACKGROUND_ID: 'xagi-background-id', // 背景图片ID
  GLOBAL_SETTINGS: 'xagi-global-settings', // 全局设置
  USER_THEME_CONFIG: 'xagi-user-theme-config', // 用户主题配置
  HAS_USER_SWITCH_THEME: 'xagi-has-user-switch-theme', // 用户主题配置是否用户切换过
  TENANT_CONFIG_INFO: 'TENANT_CONFIG_INFO', // 租户配置信息
  AUTH_TYPE: 'AUTH_TYPE', // 认证类型
  ACCESS_TOKEN: 'ACCESS_TOKEN', // 访问令牌
  USER_INFO: 'USER_INFO', // 用户信息
  SPACE_ID: 'SPACE_ID', // 空间ID
  PATH_URL: 'PATH_URL', // 路径URL
} as const;

/**
 * 默认主题配置
 * 统一管理所有默认值，确保各模块间的一致性
 */
export const DEFAULT_THEME_CONFIG = {
  PRIMARY_COLOR: '#5e6ad2',
  BACKGROUND_ID: '',
  NAVIGATION_STYLE: 'style1',
  LAYOUT_STYLE: 'light',
  THEME: 'light',
  LANGUAGE: 'zh-CN',
} as const;

/**
 * 预定义的背景配置
 * 根据背景图的明暗程度来确定适合的布局风格
 */
export const THEME_BACKGROUND_CONFIGS: ThemeBackgroundConfig[] = [
  {
    id: 'bg-variant-1',
    name: dict('PC.Constants.Theme.bgStarryNight'),
    url: '/bg/bg-variant-1.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: dict('PC.Constants.Theme.bgStarryNightDesc'),
  },
  {
    id: 'bg-variant-2',
    name: dict('PC.Constants.Theme.bgCloudyDay'),
    url: '/bg/bg-variant-2.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: dict('PC.Constants.Theme.bgCloudyDayDesc'),
  },
  {
    id: 'bg-variant-3',
    name: dict('PC.Constants.Theme.bgForestDawn'),
    url: '/bg/bg-variant-3.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: dict('PC.Constants.Theme.bgForestDawnDesc'),
  },
  {
    id: 'bg-variant-4',
    name: dict('PC.Constants.Theme.bgDeepSeaNight'),
    url: '/bg/bg-variant-4.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: dict('PC.Constants.Theme.bgDeepSeaNightDesc'),
  },
  {
    id: 'bg-variant-5',
    name: dict('PC.Constants.Theme.bgDreamyPurple'),
    url: '/bg/bg-variant-5.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: dict('PC.Constants.Theme.bgDreamyPurpleDesc'),
  },
  {
    id: 'bg-variant-6',
    name: dict('PC.Constants.Theme.bgWarmSunshine'),
    url: '/bg/bg-variant-6.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: dict('PC.Constants.Theme.bgWarmSunshineDesc'),
  },
  {
    id: 'bg-variant-7',
    name: dict('PC.Constants.Theme.bgNightCity'),
    url: '/bg/bg-variant-7.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: dict('PC.Constants.Theme.bgNightCityDesc'),
  },
  {
    id: 'bg-variant-8',
    name: dict('PC.Constants.Theme.bgFreshBlueSky'),
    url: '/bg/bg-variant-8.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: dict('PC.Constants.Theme.bgFreshBlueSkyDesc'),
  },
];

/**
 * 四个样式配置：light-style1, light-style2, dark-style1, dark-style2
 * 注意：这些变量仅用于自定义布局组件，不影响 Ant Design 组件
 */
export const STYLE_CONFIGS: Record<string, ThemeStyleConfig> = {
  // 浅色 + 风格1
  'light-style1': {
    layout: {
      '--xagi-layout-text-primary': '#292928',
      '--xagi-layout-text-secondary': '#747471',
      '--xagi-layout-text-tertiary': '#9b9b98',
      '--xagi-layout-text-disabled': 'rgba(41, 41, 40, 0.35)',
      '--xagi-layout-second-menu-text-color': '#292928',
      '--xagi-layout-second-menu-text-color-secondary': '#747471',
      '--xagi-layout-second-menu-adaptive-text': '#292928',
      '--xagi-layout-second-menu-adaptive-text-secondary': '#747471',
      '--xagi-layout-second-menu-adaptive-text-tertiary': '#9b9b98',
      '--xagi-layout-bg-primary': '#ffffff',
      '--xagi-layout-bg-secondary': '#fafaf9',
      '--xagi-layout-bg-card': '#ffffff',
      '--xagi-layout-bg-input': '#f6f6f4',
      '--xagi-layout-border-primary': '#ececea',
      '--xagi-layout-border-secondary': '#f5f5f3',
      '--xagi-layout-shadow': 'rgba(20, 20, 20, 0.04)',
      '--xagi-layout-overlay': 'rgba(255, 255, 255, 0.7)',
      '--xagi-layout-bg-container': '#ffffff',
    },
    navigation: {
      '--xagi-nav-first-menu-width': '60px',
      '--xagi-page-container-margin': '12px',
      '--xagi-page-container-border-radius': '12px',
      '--xagi-page-container-border-color': 'transparent',
    },
  },
  // 浅色 + 风格2
  'light-style2': {
    layout: {
      '--xagi-layout-text-primary': '#292928',
      '--xagi-layout-text-secondary': '#747471',
      '--xagi-layout-text-tertiary': '#9b9b98',
      '--xagi-layout-text-disabled': 'rgba(41, 41, 40, 0.35)',
      '--xagi-layout-second-menu-text-color': '#292928',
      '--xagi-layout-second-menu-text-color-secondary': '#747471',
      '--xagi-layout-second-menu-adaptive-text': '#292928',
      '--xagi-layout-second-menu-adaptive-text-secondary': '#747471',
      '--xagi-layout-second-menu-adaptive-text-tertiary': '#9b9b98',
      '--xagi-layout-bg-primary': '#ffffff',
      '--xagi-layout-bg-secondary': '#fafaf9',
      '--xagi-layout-bg-card': '#ffffff',
      '--xagi-layout-bg-input': '#f6f6f4',
      '--xagi-layout-border-primary': '#ececea',
      '--xagi-layout-border-secondary': '#f5f5f3',
      '--xagi-layout-shadow': 'rgba(20, 20, 20, 0.04)',
      '--xagi-layout-overlay': 'rgba(255, 255, 255, 0.7)',
      '--xagi-layout-bg-container': '#ffffff',
    },
    navigation: {
      '--xagi-nav-first-menu-width': `${FIRST_MENU_WIDTH_STYLE2}px`,
      '--xagi-page-container-margin': '0',
      '--xagi-page-container-border-radius': '0',
      '--xagi-page-container-border-color': '#ececea',
    },
  },
  // 深色 + 风格1
  'dark-style1': {
    layout: {
      '--xagi-layout-text-primary': '#ecedec',
      '--xagi-layout-text-secondary': '#a0a09c',
      '--xagi-layout-text-tertiary': '#6e6e6a',
      '--xagi-layout-text-disabled': 'rgba(236, 237, 236, 0.3)',
      '--xagi-layout-second-menu-text-color': '#ecedec',
      '--xagi-layout-second-menu-text-color-secondary': '#a0a09c',
      '--xagi-layout-second-menu-adaptive-text': '#ecedec',
      '--xagi-layout-second-menu-adaptive-text-secondary': '#a0a09c',
      '--xagi-layout-second-menu-adaptive-text-tertiary': '#6e6e6a',
      '--xagi-layout-bg-primary': '#232322',
      '--xagi-layout-bg-secondary': '#1b1b1a',
      '--xagi-layout-bg-card': '#2a2a28',
      '--xagi-layout-bg-input': '#2a2a28',
      '--xagi-layout-border-primary': '#2e2e2c',
      '--xagi-layout-border-secondary': '#262624',
      '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.5)',
      '--xagi-layout-overlay': 'rgba(27, 27, 26, 0.7)',
      '--xagi-layout-bg-container': '#232322',
    },
    navigation: {
      '--xagi-nav-first-menu-width': '60px',
      '--xagi-page-container-margin': '12px',
      '--xagi-page-container-border-radius': '12px',
      '--xagi-page-container-border-color': 'transparent',
    },
  },
  // 深色 + 风格2
  'dark-style2': {
    layout: {
      '--xagi-layout-text-primary': '#ecedec',
      '--xagi-layout-text-secondary': '#a0a09c',
      '--xagi-layout-text-tertiary': '#6e6e6a',
      '--xagi-layout-text-disabled': 'rgba(236, 237, 236, 0.3)',
      '--xagi-layout-second-menu-text-color': '#ecedec',
      '--xagi-layout-second-menu-text-color-secondary': '#a0a09c',
      '--xagi-layout-second-menu-adaptive-text': '#ecedec',
      '--xagi-layout-second-menu-adaptive-text-secondary': '#a0a09c',
      '--xagi-layout-second-menu-adaptive-text-tertiary': '#6e6e6a',
      '--xagi-layout-bg-primary': '#232322',
      '--xagi-layout-bg-secondary': '#1b1b1a',
      '--xagi-layout-bg-card': '#2a2a28',
      '--xagi-layout-bg-input': '#2a2a28',
      '--xagi-layout-border-primary': '#2e2e2c',
      '--xagi-layout-border-secondary': '#262624',
      '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.5)',
      '--xagi-layout-overlay': 'rgba(27, 27, 26, 0.7)',
      '--xagi-layout-bg-container': '#232322',
    },
    navigation: {
      '--xagi-nav-first-menu-width': `${FIRST_MENU_WIDTH_STYLE2}px`,
      '--xagi-page-container-margin': '0',
      '--xagi-page-container-border-radius': '0',
      '--xagi-page-container-border-color': '#2e2e2c',
    },
  },
};

/**
 * 样式配置键名常量
 */
export const STYLE_CONFIG_KEYS = {
  LIGHT_STYLE1: 'light-style1',
  LIGHT_STYLE2: 'light-style2',
  DARK_STYLE1: 'dark-style1',
  DARK_STYLE2: 'dark-style2',
} as const;

/**
 * 所有样式配置键名数组
 */
export const ALL_STYLE_CONFIG_KEYS = Object.keys(STYLE_CONFIGS);

/**
 * 样式配置键名类型
 */
export type StyleConfigKey = keyof typeof STYLE_CONFIGS;

/**
 * Ant Design 主题 tokens
 * 用于配置 Ant Design 组件的主题
 */
export const themeTokens: Partial<AliasToken> = {
  // 品牌主色 - NewX 主色调
  colorPrimary: '#5e6ad2',

  // 功能色（NewX 功能色系）
  colorSuccess: '#23815b',
  colorWarning: '#b46620',
  colorError: '#f93920',
  colorInfo: '#4367b8',

  // 基础色 - 用于派生文本和背景色（NewX 暖灰文字系）
  colorTextBase: '#292928',
  colorBgBase: '#ffffff',
  colorText: '#292928',
  colorTextSecondary: '#747471',
  colorTextTertiary: '#9b9b98',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',

  // 超链接颜色
  colorLink: '#5e6ad2',

  // 字体配置（NewX：Inter + JetBrains Mono，字体文件本地化）
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Source Han Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  fontFamilyCode:
    '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Courier New", monospace',

  // 字号配置
  fontSize: 14,
  fontWeightStrong: 500,

  // 线条配置（NewX 1px 细线框）
  lineWidth: 1,
  lineType: 'solid',

  // 圆角配置（NewX 圆角体系 6/10/14）
  borderRadius: 6,

  // 尺寸配置
  sizeUnit: 4,
  sizeStep: 4,
  sizePopupArrow: 8,

  // 控制组件高度
  controlHeight: 32,

  // Z轴配置
  zIndexBase: 0,
  zIndexPopupBase: 1000,

  // // 图片透明度
  opacityImage: 1,

  // 动画配置
  motionUnit: 0.1,
  motionBase: 0,
  // motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
  // motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
  // motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  // motionEaseOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  // motionEaseInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  // motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  // motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  // motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',

  // 风格配置
  wireframe: false,
  motion: true,

  // 预设颜色
  blue: '#1890ff',
  purple: '#722ed1',
  cyan: '#13c2c2',
  green: '#52c41a',
  magenta: '#eb2f96',
  pink: '#eb2f96',
  red: '#f5222d',
  orange: '#fa8c16',
  yellow: '#fadb14',
  volcano: '#fa541c',
  geekblue: '#2f54eb',
  lime: '#a0d911',
  gold: '#faad14',
  // 填充颜色 浅色（NewX：ink 暖灰基派生）
  colorFill: 'rgba(41,41,40,0.08)',
  colorFillSecondary: 'rgba(41,41,40,0.05)',
  colorFillTertiary: 'rgba(41,41,40,0.03)',
  colorFillQuaternary: 'rgba(41,41,40,0.015)',

  // 边框/分割（NewX 线条系）
  colorBorder: '#dcdcda',
  colorBorderSecondary: '#ececea',
  colorSplit: 'rgba(41,41,40,0.06)',

  // 布局底色
  colorBgLayout: '#f6f6f4',

  // 阴影（NewX 轻阴影体系）
  boxShadow: '0 14px 36px rgba(0,0,0,0.11)',
  boxShadowSecondary: '0 7px 17px rgba(20,20,20,0.06)',
  boxShadowCard: '0 7px 17px rgba(20,20,20,0.04)',
  // border radius
  borderRadiusSM: 4,
  borderRadiusLG: 14,
};

export const darkThemeTokens = {
  ...themeTokens,
  // NewX 暗色版基础色
  colorBgBase: '#1b1b1a',
  colorTextBase: '#ecedec',
  colorText: '#ecedec',
  colorTextSecondary: '#a0a09c',
  colorTextTertiary: '#858580',
  colorBgContainer: '#1b1b1a',
  colorBgElevated: '#232322',

  // 填充颜色 深色（NewX：浅灰基派生，补齐原 TODO）
  colorFill: 'rgba(236,237,236,0.1)',
  colorFillSecondary: 'rgba(236,237,236,0.06)',
  colorFillTertiary: 'rgba(236,237,236,0.04)',
  colorFillQuaternary: 'rgba(236,237,236,0.02)',

  // 深色边框/分割
  colorBorder: '#3a3a38',
  colorBorderSecondary: '#2e2e2c',
  colorSplit: 'rgba(236,237,236,0.08)',
  colorBgLayout: '#151514',

  // 深色阴影
  boxShadow: '0 14px 36px rgba(0,0,0,0.44)',
  boxShadowSecondary: '0 7px 17px rgba(0,0,0,0.32)',
  boxShadowCard: '0 7px 17px rgba(0,0,0,0.28)',
};

/** Shared control density for resource pages, editors, and administration. */
export const getNewxComponentTheme = (
  primaryColor: string,
  isDark: boolean,
): ThemeConfig['components'] => {
  const paper = isDark ? '#1b1b1a' : '#ffffff';
  const surface = isDark ? '#232322' : '#fafaf9';
  const fill = isDark ? '#2a2a28' : '#f6f6f4';
  const line = isDark ? '#2e2e2c' : '#ececea';

  return {
    Button: { fontWeight: 500, primaryShadow: 'none', defaultShadow: 'none' },
    Input: { paddingBlock: 6, paddingInline: 10, activeShadow: 'none' },
    InputNumber: { activeShadow: 'none' },
    Select: { optionSelectedFontWeight: 500 },
    Table: {
      headerBg: surface,
      headerColor: isDark ? '#a0a09c' : '#747471',
      headerSplitColor: 'transparent',
      borderColor: line,
      rowHoverBg: surface,
      cellPaddingBlock: 13,
      cellPaddingInline: 16,
      headerBorderRadius: 8,
    },
    Tabs: {
      horizontalItemGutter: 24,
      titleFontSize: 13,
      inkBarColor: primaryColor,
    },
    Segmented: {
      trackBg: fill,
      itemSelectedBg: paper,
      itemSelectedColor: primaryColor,
      borderRadius: 6,
      borderRadiusSM: 4,
    },
    Card: { headerFontSize: 14, headerHeight: 48, bodyPadding: 20 },
    Modal: {
      titleFontSize: 16,
      titleLineHeight: 1.5,
      contentBg: paper,
      headerBg: paper,
    },
    Drawer: { footerPaddingBlock: 16, footerPaddingInline: 24 },
    Menu: { itemHeight: 36, itemBorderRadius: 6, subMenuItemBg: surface },
    Tree: { nodeHoverBg: surface, titleHeight: 30 },
    Collapse: { headerBg: surface, contentBg: paper },
    Descriptions: { labelBg: surface },
  };
};

// 向后兼容的导出
export const backgroundConfigs = THEME_BACKGROUND_CONFIGS;
export type BackgroundConfig = ThemeBackgroundConfig;
export type StyleConfig = ThemeStyleConfig;

export default themeTokens;
