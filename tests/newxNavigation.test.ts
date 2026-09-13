import {
  buildNewxNavigation,
  getNewxCatalogSources,
  isNewxCatalogSourceForResource,
  isNewxNavigationEntryActive,
  resolveNewxNavigationPath,
} from '@/layouts/DynamicMenusLayout/navigation';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { describe, expect, it } from 'vitest';

let menuId = 0;
const menu = (
  code: string,
  path = '',
  children: MenuItemDto[] = [],
): MenuItemDto => ({
  id: ++menuId,
  code,
  name: code,
  path,
  children,
  status: 1,
  menuBindType: 0,
});
const workspace = (...children: MenuItemDto[]) =>
  menu('workspace', '/space', children);
const entries = (menus: MenuItemDto[]) =>
  buildNewxNavigation(menus).flatMap((group) => group.entries);

describe('NewX navigation information architecture', () => {
  it('retains separately authorized resource routes with different queries', () => {
    const items = entries([
      workspace(
        menu('agent_dev', '/space/:spaceId/develop'),
        menu('team_experts', '/space/:spaceId/develop?view=team'),
      ),
    ]);
    expect(
      items
        .filter((entry) => entry.resource === 'expert')
        .map((entry) => entry.menu.path),
    ).toEqual(['/space/:spaceId/develop', '/space/:spaceId/develop?view=team']);
  });
  it('organizes authorized space leaves into the prototype resource groups', () => {
    const groups = buildNewxNavigation([
      menu('homepage', '/home'),
      workspace(
        menu('agent_dev', '/space/:spaceId/develop'),
        menu('component_resource_dev', '/space/:spaceId/library', [
          menu('workflow_dev', '/space/:spaceId/workflow'),
          menu('plugin_dev', '/space/:spaceId/plugin'),
          menu('knowledge_dev', '/space/:spaceId/knowledge'),
          menu('table_dev', '/space/:spaceId/storage'),
          menu('space_model_manage', '/space/:spaceId/model-manage'),
        ]),
        menu('skill_dev', '/space/:spaceId/skill-manage'),
        menu('mcp_dev', '/space/:spaceId/mcp'),
        menu('page_app_dev', '/space/:spaceId/page-develop'),
        menu('space_task_dev', '/space/:spaceId/task-center'),
        menu('space_log_query', '/space/:spaceId/library-log'),
        menu('space_square', '/space/:spaceId/space-square'),
        menu('member_setting', '/space/:spaceId/team'),
        menu('im_channel', '/space/:spaceId/im-channel'),
      ),
      menu('system_square', '/square'),
      menu('my_computer', '/my-computer-manage'),
      menu('more_page', '/more-page', [menu('api_key', '/more-page/api-key')]),
    ]);
    expect(groups.map((group) => group.label)).toEqual([
      '工作台',
      '任务',
      '专家 · 技能 · 连接器',
      '工作流 · 插件',
      '知识库 · 数据表',
      '网页应用',
      '空间管理',
      '日志',
    ]);
    expect(
      groups.find((group) => group.key === 'manage')?.entries[0].menu.code,
    ).toBe('member_setting');
    expect(
      groups.find((group) => group.key === 'manage')?.entries,
    ).toHaveLength(1);
    const spaceManagement = groups.find((group) => group.key === 'manage')
      ?.entries[0];
    const logs = groups.find((group) => group.key === 'logs')?.entries[0];
    expect(logs?.menu).toMatchObject({
      code: 'space_log_query',
      path: '/space/:spaceId/library-log',
    });
    expect(
      isNewxNavigationEntryActive(spaceManagement!, '/space/8/team', '', 8),
    ).toBe(true);
    expect(
      isNewxNavigationEntryActive(
        logs!,
        '/space/8/library-log',
        '?targetType=Agent',
        8,
      ),
    ).toBe(true);
    expect(
      groups
        .flatMap((group) => group.entries)
        .some((entry) => entry.menu.code === 'space_model_manage'),
    ).toBe(false);
    expect(
      groups
        .flatMap((group) => group.entries)
        .every((entry) => !entry.menu.path?.includes('square')),
    ).toBe(true);
  });

  it('keeps the original member settings page above logs', () => {
    const groups = buildNewxNavigation([
      workspace(
        menu('space_log_query', '/space/:spaceId/library-log'),
        menu('member_setting', '/space/:spaceId/team'),
      ),
    ]);

    expect(groups.map((group) => group.label)).toEqual(['空间管理', '日志']);
    expect(groups[0].entries[0].menu.code).toBe('member_setting');
    expect(groups[1].entries[0].menu.code).toBe('space_log_query');
  });

  it('normalizes a legacy agent log menu to the workspace log page', () => {
    const [entry] = entries([
      workspace(menu('space_log_query', '/space/:spaceId/:agentId/log')),
    ]);

    expect(entry.menu.path).toBe('/space/:spaceId/library-log');
    expect(resolveNewxNavigationPath(entry.menu.path || '', 8)).toBe(
      '/space/8/library-log',
    );
  });

  it('does not invent resources missing from the authorized tree', () => {
    const groups = buildNewxNavigation([
      workspace(menu('skill_dev', '/space/:spaceId/skill-manage')),
    ]);
    expect(groups.map((group) => group.label)).toEqual(['技能']);
    expect(groups[0].entries.map((entry) => entry.resource)).toEqual(['skill']);
  });

  it('retains disabled/developer/member and subscription restrictions', () => {
    const disabled = {
      ...menu('mcp_dev', '/space/:spaceId/mcp'),
      status: 0 as const,
    };
    const groups = buildNewxNavigation(
      [
        workspace(
          menu('agent_dev', '/space/:spaceId/develop'),
          menu('component_lib_dev', '', [
            menu('plugin_dev', '/space/:spaceId/plugin'),
          ]),
          menu('member_setting', '/space/:spaceId/team'),
          menu('resource_pricing', '/space/:spaceId/resource-pricing'),
          menu('space_task_dev', '/space/:spaceId/task-center'),
          disabled,
        ),
      ],
      {
        isOrdinaryMember: true,
        allowDevelop: false,
        enableSubscription: false,
      },
    );
    expect(
      groups.flatMap((group) => group.entries).map((entry) => entry.menu.code),
    ).toEqual(['space_task_dev']);
  });

  it('retains published resources for members whose development access is disabled', () => {
    const groups = buildNewxNavigation(
      [
        workspace(
          menu('agent_dev', '/space/:spaceId/develop'),
          menu('component_lib_dev', '', [
            menu('plugin_dev', '/space/:spaceId/plugin'),
          ]),
          menu('space_square', '/space/:spaceId/space-square'),
        ),
      ],
      { isOrdinaryMember: true, allowDevelop: false },
    );
    const published = groups.flatMap((group) => group.entries);
    expect(published.every((entry) => entry.catalogScope === 'space')).toBe(
      true,
    );
    expect(
      published.some(
        (entry) =>
          entry.resource === 'expert' &&
          entry.menu.path === '/space/:spaceId/space-square?activeKey=Agent',
      ),
    ).toBe(true);
    expect(
      published.some(
        (entry) =>
          entry.resource === 'plugin' &&
          entry.menu.path === '/space/:spaceId/space-square?activeKey=Plugin',
      ),
    ).toBe(true);
    expect(
      published.some((entry) => entry.menu.path?.includes('/develop')),
    ).toBe(false);
    expect(groups.some((group) => /广场|square/.test(group.label))).toBe(false);
  });

  it('preserves both authorized catalog sources and template routes without development menus', () => {
    const published = entries([
      workspace(menu('space_square', '/space/:spaceId/space-square')),
      menu('system_square', '/square'),
    ]).filter((entry) => entry.resource === 'expert');
    expect(published.map((entry) => entry.menu.path)).toEqual([
      '/space/:spaceId/space-square?activeKey=Agent',
      '/space/:spaceId/space-square?activeKey=Template&templateTarget=ChatBot',
      '/square?cate_type=Agent',
      '/square?cate_type=Template&cate_name=ChatBot',
    ]);
    expect(new Set(published.map((entry) => entry.key)).size).toBe(4);
  });

  it('never derives catalog access from disabled ancestors or development access alone', () => {
    const disabledRoot = {
      ...workspace(menu('space_square', '/space/:spaceId/space-square')),
      status: 0 as const,
    };
    const sources = getNewxCatalogSources([
      disabledRoot,
      { ...menu('system_square', '/square'), status: 0 },
      workspace(menu('agent_dev', '/space/:spaceId/develop')),
    ]);
    expect(sources).toEqual({ discover: [], space: [] });
    expect(entries([disabledRoot])).toEqual([]);
  });

  it('treats standard square query parameters as the initial tab, preserving all legacy resource types', () => {
    const sources = getNewxCatalogSources([
      menu('system_square', '/square?cate_type=Agent'),
      workspace(
        menu('space_square', '/space/:spaceId/space-square?activeKey=Agent'),
      ),
    ]);
    for (const source of [...sources.discover, ...sources.space]) {
      expect(isNewxCatalogSourceForResource(source, 'skill', false, 1)).toBe(
        true,
      );
      expect(isNewxCatalogSourceForResource(source, 'workflow', true, 1)).toBe(
        true,
      );
    }
  });

  it('keeps catalog category and fixed-space restrictions when constructing read-only entries', () => {
    const menus = [
      menu('plugins_only', '/square?cate_type=Plugin&cate_name=Tools'),
      workspace(
        menu(
          'team_templates',
          '/space/9/space-square?activeKey=Template&templateTarget=Workflow',
        ),
      ),
    ];
    const published = entries(menus);
    expect(published.map((entry) => entry.resource)).toEqual([
      'workflow',
      'plugin',
    ]);
    expect(
      published.find((entry) => entry.resource === 'plugin')?.menu.path,
    ).toBe('/square?cate_type=Plugin&cate_name=Tools');
    const source = getNewxCatalogSources(menus).space[0];
    expect(isNewxCatalogSourceForResource(source, 'workflow', true, 9)).toBe(
      true,
    );
    expect(isNewxCatalogSourceForResource(source, 'workflow', true, 8)).toBe(
      false,
    );
    expect(isNewxCatalogSourceForResource(source, 'expert', true, 9)).toBe(
      false,
    );
    expect(isNewxCatalogSourceForResource(source, 'workflow', false, 9)).toBe(
      false,
    );
  });

  it('retains unknown custom leaf paths and a custom parent overview', () => {
    const parent = menu('custom_tools', '/space/:spaceId/custom-overview', [
      menu('custom_child', '/space/:spaceId/custom-child?view=all'),
    ]);
    const groups = buildNewxNavigation([
      workspace(parent, menu('member_setting', '/space/:spaceId/team')),
    ]);
    const result = groups.flatMap((group) => group.entries);
    expect(result.map((entry) => entry.menu.path)).toEqual([
      '/space/:spaceId/team',
      '/space/:spaceId/custom-overview',
      '/space/:spaceId/custom-child?view=all',
    ]);
    expect(result.every((entry) => entry.parentCode === 'workspace')).toBe(
      true,
    );
    expect(
      groups
        .find((group) => group.key === 'manage')
        ?.entries.map((entry) => entry.menu.code),
    ).toEqual(['member_setting']);
    expect(
      groups.find((group) => group.key === 'space:custom_tools'),
    ).toBeDefined();
  });

  it('retains the complete system/custom hierarchy for dynamic flyouts', () => {
    const tree = menu('system_manage', '/system', [
      menu('configuration', '', [menu('custom_page', '/system/custom')]),
    ]);
    const [group] = buildNewxNavigation([tree]);
    expect(group.treeCode).toBe('system_manage');
    expect(group.entries[0].menu.children?.[0].children?.[0].path).toBe(
      '/system/custom',
    );
  });

  it('filters disabled and settings entries at any depth in custom menu trees', () => {
    const tree = menu('custom_root', '', [
      menu('nested', '', [
        { ...menu('disabled', '/private'), status: 0 },
        menu('api_key', '/more-page/api-key'),
        menu('allowed', '/custom/allowed'),
      ]),
    ]);
    const [group] = buildNewxNavigation([tree]);
    expect(
      group.entries[0].menu.children?.[0].children?.map((item) => item.code),
    ).toEqual(['allowed']);
  });

  it('uses the selected space and preserves query/hash while replacing every route parameter', () => {
    expect(
      resolveNewxNavigationPath(
        '/space/:spaceId/:agentId/log?type=Plugin#recent',
        8,
        { spaceId: '2', agentId: '11' },
      ),
    ).toBe('/space/8/11/log?type=Plugin#recent');
    expect(
      resolveNewxNavigationPath('/space/:spaceId/:agentId/log', 8),
    ).toBeNull();
    expect(resolveNewxNavigationPath('https://example.com/docs?a=1', 8)).toBe(
      'https://example.com/docs?a=1',
    );
    expect(resolveNewxNavigationPath('/homepage', 8)).toBe('/home');
  });

  it('matches typed routes without marking other resource queries active', () => {
    const [entry] = entries([
      workspace(menu('custom_plugin', '/space/:spaceId/library?type=Plugin')),
    ]);
    expect(
      isNewxNavigationEntryActive(entry, '/space/3/library', '?type=Plugin', 3),
    ).toBe(true);
    expect(
      isNewxNavigationEntryActive(
        entry,
        '/space/3/library',
        '?type=Workflow',
        3,
      ),
    ).toBe(false);
  });

  it('highlights custom nested pages and in-app external menu routes', () => {
    const [group] = buildNewxNavigation([
      menu('tools', '', [menu('nested', '', [menu('custom', '/custom/page')])]),
    ]);
    expect(
      isNewxNavigationEntryActive(group.entries[0], '/custom/page', '', 3),
    ).toBe(true);
    expect(
      isNewxNavigationEntryActive(
        group.entries[0],
        '/open-iframe-page/custom',
        '?url=https://example.com',
        3,
        { menuCode: 'custom' },
      ),
    ).toBe(true);
  });

  it('keeps one workbench entry while retaining the existing history new-chat action', () => {
    expect(
      buildNewxNavigation([
        menu('new_conversation', '/'),
        menu('homepage', '/home'),
      ]).map((group) => group.label),
    ).toEqual(['工作台']);
    expect(
      buildNewxNavigation([menu('new_conversation', '/')])[0].entries[0].menu
        .code,
    ).toBe('new_conversation');
  });
});
