import type { MenuItemDto } from '@/types/interfaces/menu';

export interface NewxNavigationEntry {
  key: string;
  menu: MenuItemDto;
  parentCode: string;
  label: string;
  icon: string;
  resource?: string;
  /** 沿用授权广场地址的只读资源入口，不代表开发权限。 */
  catalogScope?: 'discover' | 'space';
}

export interface NewxNavigationGroup {
  key: string;
  label: string;
  icon: string;
  entries: NewxNavigationEntry[];
  /** 自定义/系统菜单继续使用原动态树，保留任意深度的扩展菜单。 */
  treeCode?: string;
}

export interface NavigationContext {
  isOrdinaryMember?: boolean;
  allowDevelop?: boolean;
  enableSubscription?: boolean;
  english?: boolean;
}

const settingCodes = new Set([
  'im_channel',
  'my_computer',
  'more_page',
  'api_key',
  'space_model_manage',
]);
const resourceContainers = new Set([
  'workspace',
  'space',
  'component_lib_dev',
  'component_resource_dev',
]);

/** 设置内统一承接这些既有路由，主导航不再重复展示。 */
export const isSettingsNavigationMenu = (menu: MenuItemDto): boolean =>
  settingCodes.has(menu.code || '') ||
  /\/(?:im-channel|my-computer-manage)(?:[/?#]|$)/.test(menu.path || '') ||
  /^\/space\/[^/]+\/model-manage(?:[/?#]|$)/.test(menu.path || '') ||
  (menu.path || '').startsWith('/more-page');

export interface NewxCatalogSource {
  menu: MenuItemDto;
  parentCode: string;
  scope: 'discover' | 'space';
}

/** 广场权限必须来自完整启用的菜单祖先链，不能由开发菜单推断。 */
export const getNewxCatalogSources = (menus: MenuItemDto[]) => {
  const sources: Record<'discover' | 'space', NewxCatalogSource[]> = {
    discover: [],
    space: [],
  };
  const visit = (menu: MenuItemDto, parentCode: string) => {
    if (menu.status === 0 || isSettingsNavigationMenu(menu)) return;
    const path = menu.path || '';
    const scope = /^\/square(?:[/?#]|$)/.test(path)
      ? 'discover'
      : /^\/space\/[^/]+\/space-square(?:[/?#]|$)/.test(path)
      ? 'space'
      : !path && menu.code === 'system_square'
      ? 'discover'
      : !path && menu.code === 'space_square'
      ? 'space'
      : null;
    if (scope)
      sources[scope].push({
        menu: {
          ...menu,
          path:
            path ||
            (scope === 'discover' ? '/square' : '/space/:spaceId/space-square'),
        },
        parentCode,
        scope,
      });
    menu.children?.forEach((child) => visit(child, parentCode));
  };
  menus.forEach((menu) => visit(menu, menu.code || ''));
  return sources;
};

const catalogResourceTypes: Record<string, string> = {
  expert: 'Agent',
  skill: 'Skill',
  workflow: 'Workflow',
  plugin: 'Plugin',
  knowledge: 'Knowledge',
  app: 'PageApp',
};
const catalogTemplateTypes: Record<string, string> = {
  expert: 'ChatBot',
  skill: 'Skill',
  workflow: 'Workflow',
  app: 'PageApp',
};

/** 带分类限制的广场菜单只授权原分类；固定空间地址也仅授权该空间。 */
export const isNewxCatalogSourceForResource = (
  source: NewxCatalogSource,
  resource: string,
  template = false,
  spaceId?: string | number,
): boolean => {
  const path = source.menu.path || '';
  const [pathname, query = ''] = path.split('#')[0].split('?');
  if (source.scope === 'space') {
    if (resource === 'knowledge') return false;
    const sourceSpaceId = pathname.match(/^\/space\/([^/]+)\//)?.[1];
    if (
      spaceId !== undefined &&
      sourceSpaceId !== ':spaceId' &&
      sourceSpaceId !== String(spaceId)
    )
      return false;
  }
  const targetType = template ? 'Template' : catalogResourceTypes[resource];
  if (!targetType || (template && !catalogTemplateTypes[resource]))
    return false;
  // 旧系统的标准广场菜单用 query 指定初始页签，SquareSection 仍可
  // 切换全部资源类型；这些默认值不是分类授权限制。
  if (
    source.menu.code === 'system_square' ||
    source.menu.code === 'space_square'
  ) {
    return true;
  }
  const params = new URLSearchParams(query);
  const allowedType = params.get(
    source.scope === 'discover' ? 'cate_type' : 'activeKey',
  );
  if (allowedType && allowedType !== targetType) return false;
  const allowedTemplate = params.get(
    source.scope === 'discover' ? 'cate_name' : 'templateTarget',
  );
  return !(
    template &&
    allowedTemplate &&
    allowedTemplate !== catalogTemplateTypes[resource]
  );
};

const catalogPath = (
  source: NewxCatalogSource,
  resource: string,
  template = false,
) => {
  const [beforeHash, hash] = (source.menu.path || '').split('#');
  const [pathname, query = ''] = beforeHash.split('?');
  const params = new URLSearchParams(query);
  params.set(
    source.scope === 'discover' ? 'cate_type' : 'activeKey',
    template ? 'Template' : catalogResourceTypes[resource],
  );
  if (template)
    params.set(
      source.scope === 'discover' ? 'cate_name' : 'templateTarget',
      catalogTemplateTypes[resource],
    );
  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ''}`;
};

const resourceDefinition = (menu: MenuItemDto) => {
  const path = (menu.path || '').split('?')[0].replace(/\/$/, '');
  const code = menu.code || '';
  if (code === 'homepage' || path === '/home' || path === '/homepage')
    return ['home', '工作台', 'Workspace', 'icons-nav-home', 'main'];
  if (code === 'agent_dev' || /\/develop$/.test(path))
    return ['expert', '专家', 'Experts', 'icons-nav-stars', 'capabilities'];
  if (code === 'skill_dev' || /\/skill-manage$/.test(path))
    return ['skill', '技能', 'Skills', 'icons-nav-stars', 'capabilities'];
  if (code === 'mcp_dev' || /\/mcp$/.test(path))
    return [
      'connector',
      '连接器',
      'Connectors',
      'icons-nav-workspace',
      'capabilities',
    ];
  if (/\/workflow$/.test(path))
    return [
      'workflow',
      '工作流',
      'Workflows',
      'icons-nav-workspace',
      'workflows',
    ];
  if (/\/plugin$/.test(path))
    return ['plugin', '插件', 'Plugins', 'icons-nav-ecosystem', 'workflows'];
  if (/\/knowledge$/.test(path))
    return ['knowledge', '知识库', 'Knowledge', 'icons-nav-doc', 'knowledge'];
  if (/\/storage$/.test(path))
    return ['table', '数据表', 'Tables', 'icons-nav-workspace', 'knowledge'];
  if (code === 'page_app_dev' || /\/page-develop$/.test(path))
    return ['app', '网页应用', 'Web apps', 'icons-nav-workspace', 'apps'];
  if (code === 'space_task_dev' || /\/task-center$/.test(path))
    return ['task', '任务', 'Tasks', 'icons-nav-task-time', 'tasks'];
  if (code === 'member_setting' || /\/team$/.test(path))
    return [
      'space-management',
      '空间管理',
      'Space management',
      'icons-nav-settings',
      'manage',
    ];
  if (code === 'space_log_query' || /\/library-log$/.test(path))
    return ['space-log', '日志', 'Logs', 'icons-chat-history', 'logs'];
  return null;
};

/** 从后端授权树构建原型的资源分组，权限只会收窄，不新增授权路由。 */
export const buildNewxNavigation = (
  menus: MenuItemDto[],
  context: NavigationContext = {},
): NewxNavigationGroup[] => {
  const groups = new Map<string, NewxNavigationGroup>();
  const seen = new Set<string>();
  const seenResources = new Set<string>();
  const hasHome = menus.some(
    (menu) => menu.code === 'homepage' && menu.status !== 0,
  );
  const word = (zh: string, en: string) => (context.english ? en : zh);
  const add = (groupKey: string, entry: NewxNavigationEntry) => {
    const routeKey =
      (entry.resource && `${entry.resource}:${entry.menu.path}`) ||
      `${entry.parentCode}:${entry.menu.code || entry.menu.id}:${
        entry.menu.path
      }`;
    if (seen.has(routeKey)) return;
    seen.add(routeKey);
    if (entry.resource && !entry.catalogScope)
      seenResources.add(entry.resource);
    const group = groups.get(groupKey) || {
      key: groupKey,
      label:
        groupKey === 'manage'
          ? word('空间管理', 'Space management')
          : entry.label,
      icon: entry.icon,
      entries: [],
    };
    group.entries.push(entry);
    groups.set(groupKey, group);
  };

  const filterTree = (items: MenuItemDto[]): MenuItemDto[] =>
    items
      .filter((item) => item.status !== 0 && !isSettingsNavigationMenu(item))
      .map((item) => ({
        ...item,
        children: item.children ? filterTree(item.children) : undefined,
      }))
      .filter(
        (item) => !item.children || item.children.length > 0 || !!item.path,
      );

  const visit = (menu: MenuItemDto, parentCode: string, inSpace = false) => {
    if (menu.status === 0 || isSettingsNavigationMenu(menu)) return;
    const code = menu.code || '';
    const path = menu.path || '';
    if (
      code === 'system_square' ||
      code === 'space_square' ||
      /^\/square(?:[/?#]|$)/.test(path) ||
      /\/space-square(?:[/?#]|$)/.test(path)
    )
      return;
    if (context.isOrdinaryMember && code === 'member_setting') return;
    if (
      context.isOrdinaryMember &&
      context.allowDevelop === false &&
      ['agent_dev', 'component_lib_dev', 'component_resource_dev'].includes(
        code,
      )
    )
      return;
    if (context.enableSubscription === false && code === 'resource_pricing')
      return;
    if (code === 'new_conversation') {
      if (!hasHome)
        add('main', {
          key: code,
          menu,
          parentCode,
          label: word('工作台', 'Workspace'),
          icon: 'icons-nav-home',
          resource: 'home',
        });
      return;
    }
    const spaceNode = inSpace || code === 'workspace' || code === 'space';
    if (menu.children?.length && (spaceNode || resourceContainers.has(code))) {
      // 有独立页面的自定义父节点仍可直达；结构性容器仅展开其授权子项。
      if (menu.path && !resourceContainers.has(code)) {
        const definition = resourceDefinition(menu);
        const [resource, zh, en, icon, group] = definition || [];
        add(group || `space:${code || menu.id}`, {
          key: code || String(menu.id),
          menu: { ...menu, children: undefined },
          parentCode,
          label: definition ? word(zh, en) : menu.name,
          icon: menu.icon || icon || 'icons-nav-workspace',
          resource,
        });
      }
      menu.children.forEach((child) => visit(child, parentCode, true));
      return;
    }
    if (resourceContainers.has(code) && (!path || path === '/space')) return;
    if (menu.children?.length) {
      const children = filterTree(menu.children);
      if (!children.length) return;
      groups.set(`tree:${code || menu.id}`, {
        key: `tree:${code || menu.id}`,
        label: menu.name,
        icon: menu.icon || 'icons-nav-settings',
        treeCode: code,
        entries: [
          {
            key: code || String(menu.id),
            menu: { ...menu, children },
            parentCode,
            label: menu.name,
            icon: menu.icon || 'icons-nav-settings',
          },
        ],
      });
      return;
    }
    const navigationMenu =
      code === 'space_log_query' && /\/:agentId\/log(?:[/?#]|$)/.test(path)
        ? { ...menu, path: '/space/:spaceId/library-log' }
        : menu;
    const definition = resourceDefinition(navigationMenu);
    const [resource, zh, en, icon, group] = definition || [];
    add(
      group ||
        (spaceNode ? `space:${code || menu.id}` : `custom:${code || menu.id}`),
      {
        key: code || String(menu.id),
        menu: navigationMenu,
        parentCode,
        label: definition ? word(zh, en) : menu.name,
        icon: menu.icon || icon || 'icons-nav-workspace',
        resource,
      },
    );
  };
  menus.forEach((menu) => visit(menu, menu.code || ''));
  // 只有广场权限的成员仍可从对应资源分组访问已发布内容。
  // 有开发入口时由资源页的 scope 切换承接；否则保留每个授权来源。
  const catalogSources = getNewxCatalogSources(menus);
  const resourcePaths = [
    '/develop',
    '/skill-manage',
    '/workflow',
    '/plugin',
    '/knowledge',
    '/page-develop',
  ];
  resourcePaths.forEach((path) => {
    const definition = resourceDefinition({ path } as MenuItemDto);
    if (!definition) return;
    const [resource, zh, en, icon, group] = definition;
    if (seenResources.has(resource)) return;
    const sources = [...catalogSources.space, ...catalogSources.discover];
    sources.forEach((source) => {
      [false, true].forEach((template) => {
        if (!isNewxCatalogSourceForResource(source, resource, template)) return;
        const sourceLabel =
          source.scope === 'space'
            ? word('空间', 'In space')
            : word('发现', 'Discover');
        const label = `${word(zh, en)}${
          template ? word('模板', ' templates') : ''
        } · ${sourceLabel}`;
        const key = `catalog:${source.scope}:${source.menu.id}:${resource}:${template}`;
        add(group, {
          key,
          menu: {
            ...source.menu,
            // 每个分类保留不同 menuCode，避免浏览器状态将同源分类全部选中。
            code: key,
            path: catalogPath(source, resource, template),
            children: undefined,
          },
          parentCode: source.parentCode,
          resource,
          catalogScope: source.scope,
          label,
          icon,
        });
      });
    });
  });
  ['capabilities', 'workflows', 'knowledge', 'apps'].forEach((key) => {
    const group = groups.get(key);
    if (group) {
      const order = [
        'expert',
        'skill',
        'connector',
        'workflow',
        'plugin',
        'knowledge',
        'table',
      ];
      group.entries.sort(
        (a, b) =>
          order.indexOf(a.resource || '') - order.indexOf(b.resource || ''),
      );
      const resourceLabels = new Map<string, string>();
      group.entries.forEach((entry) => {
        resourceLabels.set(
          entry.resource || entry.key,
          entry.catalogScope
            ? entry.label.split(' · ')[0].replace(/模板$| templates$/, '')
            : entry.label,
        );
      });
      group.label = [...resourceLabels.values()].join(' · ');
    }
  });
  const order = [
    'main',
    'tasks',
    'capabilities',
    'workflows',
    'knowledge',
    'apps',
    'manage',
    'logs',
  ];
  return [...groups.values()].sort((a, b) => {
    const rank = (key: string) =>
      order.includes(key) ? order.indexOf(key) : order.length;
    return rank(a.key) - rank(b.key);
  });
};

/** 优先使用当前所选空间，绝不从旧工作流缓存猜测空间。 */
export const resolveNewxNavigationPath = (
  path: string,
  spaceId?: string | number,
  params: Record<string, string | undefined> = {},
): string | null => {
  if (path === '/homepage') return '/home';
  if (!path) return null;
  let missing = false;
  const result = path.replace(
    /(^|\/):([a-zA-Z]\w*)/g,
    (_, separator: string, key: string) => {
      const value = key === 'spaceId' ? spaceId : params[key];
      if (value === undefined || value === null || value === '') {
        missing = true;
        return '';
      }
      return `${separator}${encodeURIComponent(String(value))}`;
    },
  );
  return missing ? null : result;
};

export const isNewxNavigationEntryActive = (
  entry: NewxNavigationEntry,
  pathname: string,
  search: string,
  spaceId?: string | number,
  params: Record<string, string | undefined> = {},
): boolean => {
  const containsMenuCode = (menu: MenuItemDto, code: string): boolean =>
    menu.code === code ||
    !!menu.children?.some((child) => containsMenuCode(child, code));
  if (params.menuCode && containsMenuCode(entry.menu, params.menuCode))
    return true;
  if (
    entry.menu.children?.some((child) =>
      isNewxNavigationEntryActive(
        { ...entry, menu: child, resource: undefined },
        pathname,
        search,
        spaceId,
        params,
      ),
    )
  )
    return true;
  if (entry.resource === 'home')
    return (
      pathname === '/' ||
      pathname.startsWith('/home') ||
      pathname.startsWith('/agent/')
    );
  const resolved = resolveNewxNavigationPath(
    entry.menu.path || '',
    spaceId,
    params,
  );
  if (!resolved) return false;
  const [targetPath, query = ''] = resolved.split('?');
  if (pathname !== targetPath && !pathname.startsWith(`${targetPath}/`))
    return false;
  const currentSearch = new URLSearchParams(search);
  return [...new URLSearchParams(query)].every(
    ([key, value]) => currentSearch.get(key) === value,
  );
};
