import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const layoutMocks = vi.hoisted(() => ({
  handleHideHoverMenu: vi.fn(),
  handleShowHoverMenu: vi.fn(),
}));

vi.mock('umi', () => ({
  useLocation: () => ({ pathname: '/home', search: '' }),
  useModel: () => layoutMocks,
}));

vi.mock('antd', async () => {
  const React = await import('react');
  return {
    Popover: ({
      children,
      content,
      open,
    }: {
      children: React.ReactNode;
      content: React.ReactNode;
      open?: boolean;
    }) =>
      React.createElement(
        'div',
        null,
        children,
        open
          ? React.createElement(
              'div',
              { 'data-testid': 'navigation-popover' },
              content,
            )
          : null,
      ),
  };
});

vi.mock('@ant-design/icons', async () => {
  const React = await import('react');
  return {
    RightOutlined: () => React.createElement('span', null, '>'),
  };
});

vi.mock('@/components/base', async () => {
  const React = await import('react');
  return {
    SvgIcon: ({ name }: { name: string }) =>
      React.createElement('span', { 'data-icon': name }),
  };
});

vi.mock('@/layouts/DynamicMenusLayout/DynamicSecondMenu', () => ({
  default: () => null,
}));

vi.mock('@/layouts/DynamicMenusLayout/DynamicTabs/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

vi.mock('@/layouts/DynamicMenusLayout/DynamicTabs/TabItem/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

import DynamicTabs from '@/layouts/DynamicMenusLayout/DynamicTabs';
import type {
  NewxNavigationEntry,
  NewxNavigationGroup,
} from '@/layouts/DynamicMenusLayout/navigation';

const createEntry = (
  key: string,
  label: string,
  path: string,
): NewxNavigationEntry => ({
  key,
  label,
  icon: `icon-${key}`,
  parentCode: 'space',
  menu: { code: key, path } as NewxNavigationEntry['menu'],
});

const renderTabs = (groups: NewxNavigationGroup[], onClick = vi.fn()) => {
  render(
    <DynamicTabs
      groups={groups}
      activeKeys={new Set()}
      layoutStyle="light"
      navigationStyle="side"
      onClick={onClick}
    />,
  );
  return onClick;
};

describe('NewX DynamicTabs navigation behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates directly when Space management has one entry', () => {
    const spaceManagement = createEntry(
      'member_setting',
      '空间管理',
      '/space/:spaceId/team',
    );
    const onClick = renderTabs([
      {
        key: 'manage',
        label: '空间管理',
        icon: 'icons-nav-settings',
        entries: [spaceManagement],
      },
    ]);

    fireEvent.click(screen.getByRole('button', { name: '空间管理' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith(spaceManagement);
    expect(screen.queryByTestId('navigation-popover')).not.toBeInTheDocument();
  });

  it('opens a flyout for multiple entries before navigating', () => {
    const workflow = createEntry(
      'workflow_dev',
      '工作流',
      '/space/:spaceId/workflow',
    );
    const plugin = createEntry('plugin_dev', '插件', '/space/:spaceId/plugin');
    const onClick = renderTabs([
      {
        key: 'workflows',
        label: '工作流 · 插件',
        icon: 'icons-nav-ecosystem',
        entries: [workflow, plugin],
      },
    ]);

    fireEvent.click(screen.getByRole('button', { name: '工作流 · 插件' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByTestId('navigation-popover')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '工作流' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith(workflow);
    expect(screen.queryByTestId('navigation-popover')).not.toBeInTheDocument();
  });
});
