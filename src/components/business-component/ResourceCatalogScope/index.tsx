import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import {
  buildNewxNavigation,
  getNewxCatalogSources,
  isNewxCatalogSourceForResource,
  isNewxNavigationEntryActive,
  resolveNewxNavigationPath,
  type NewxNavigationEntry,
} from '@/layouts/DynamicMenusLayout/navigation';
import {
  handleOpenUrl,
  isHttpMenuPath,
  isOpenIframePath,
  navigateOpenIframePath,
  normalizeMenuPathname,
  updatePathUrlToLocalStorage,
} from '@/layouts/DynamicMenusLayout/utils';
import { dict } from '@/services/i18nRuntime';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import { Empty } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  history,
  useLocation,
  useModel,
  useParams,
  useSearchParams,
} from 'umi';
import styles from './index.less';

const resourcePaths: Record<string, string> = {
  develop: 'expert',
  'skill-manage': 'skill',
  workflow: 'workflow',
  plugin: 'plugin',
  knowledge: 'knowledge',
  'page-develop': 'app',
};

const resourceGroupKeys = new Set(['capabilities', 'workflows', 'knowledge']);
const resourceIcons: Record<string, string> = {
  expert: '◌',
  skill: '✧',
  connector: '↔',
  workflow: '⌘',
  plugin: '⊞',
  knowledge: '▤',
  table: '▦',
};

const useResourceNavigation = () => {
  const { pathname, search } = useLocation();
  const params = useParams();
  const { language } = useUnifiedTheme();
  const { firstLevelMenus } = useModel('menuModel');
  const { currentSpaceInfo, getSpaceId } = useModel('spaceModel');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const selectedSpaceId =
    params.spaceId || currentSpaceInfo?.id || getSpaceId();
  const groups = useMemo(
    () =>
      buildNewxNavigation(firstLevelMenus, {
        isPersonal: currentSpaceInfo?.type === SpaceTypeEnum.Personal,
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
  return { groups, params, selectedSpaceId, pathname, search, firstLevelMenus };
};

/** Share the sidebar's authorized resources, space restrictions and route resolution. */
export const ResourceTypeTabs: React.FC<{ contained?: boolean }> = ({
  contained = false,
}) => {
  const { groups, params, selectedSpaceId, pathname, search } =
    useResourceNavigation();
  const currentPath = normalizeMenuPathname(pathname);
  const isActive = (entry: NewxNavigationEntry) =>
    isNewxNavigationEntryActive(
      entry,
      currentPath,
      search,
      selectedSpaceId,
      params,
    );
  const resolvedGroups = groups
    .filter((group) => resourceGroupKeys.has(group.key))
    .map((group) => ({
      ...group,
      entries: group.entries.flatMap((entry) => {
        const path = resolveNewxNavigationPath(
          entry.menu.path || '',
          selectedSpaceId,
          params,
        );
        return path ? [{ entry, path }] : [];
      }),
    }));
  const group = resolvedGroups.find((item) =>
    item.entries.some(({ entry }) => isActive(entry)),
  );
  if (!group) return null;
  const visibleEntries = new Map<string, (typeof group.entries)[number]>();
  group.entries.forEach((item) => {
    const resource = item.entry.resource || item.entry.key;
    const previous = visibleEntries.get(resource);
    if (
      !previous ||
      isActive(item.entry) ||
      (!isActive(previous.entry) &&
        previous.entry.catalogScope &&
        !item.entry.catalogScope)
    )
      visibleEntries.set(resource, item);
  });

  const handleNavigation = (entry: NewxNavigationEntry, path: string) => {
    const { menu, parentCode } = entry;
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

  return (
    <nav className={`${styles.types} ${contained ? styles.contained : ''}`}>
      {[...visibleEntries.values()].map(({ entry, path }) => (
        <button
          type="button"
          key={entry.key}
          aria-current={isActive(entry) ? 'page' : undefined}
          onClick={() => handleNavigation(entry, path)}
        >
          <span aria-hidden="true">{resourceIcons[entry.resource || '']}</span>
          {entry.label}
        </button>
      ))}
    </nav>
  );
};

interface ResourceCatalogScopeProps {
  children: React.ReactNode;
  discovery: React.ReactNode;
  published?: React.ReactNode;
  templates?: React.ReactNode;
  spaceTemplates?: React.ReactNode;
}

/** Keep the existing resource editor mounted while browsing published resources. */
const ResourceCatalogScope: React.FC<ResourceCatalogScopeProps> = ({
  children,
  discovery,
  published,
  templates,
  spaceTemplates,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { groups, params, selectedSpaceId, pathname, firstLevelMenus } =
    useResourceNavigation();
  const currentPath = normalizeMenuPathname(pathname);
  const mineEntry = groups
    .flatMap((group) => group.entries)
    .find((entry) => {
      if (entry.catalogScope) return false;
      const path = resolveNewxNavigationPath(
        entry.menu.path || '',
        selectedSpaceId,
        params,
      );
      return path && normalizeMenuPathname(path.split('?')[0]) === currentPath;
    });
  const resource =
    mineEntry?.resource || resourcePaths[currentPath.split('/').pop() || ''];
  const sources = getNewxCatalogSources(firstLevelMenus);
  const allowsSource = (source: 'discover' | 'space', template = false) =>
    !!resource &&
    sources[source].some((item) =>
      isNewxCatalogSourceForResource(item, resource, template, selectedSpaceId),
    );
  const canMine = !!mineEntry;
  const canDiscover = !!discovery && allowsSource('discover');
  const canPublish = !!published && allowsSource('space');
  const canTemplates = !!templates && allowsSource('discover', true);
  const canSpaceTemplates = !!spaceTemplates && allowsSource('space', true);
  const requestedScope = searchParams.get('scope') || 'mine';
  const availableScopes: Record<string, React.ReactNode> = {
    ...(canMine ? { mine: children } : {}),
    ...(canDiscover ? { discover: discovery } : {}),
    ...(canPublish ? { space: published } : {}),
    ...(canTemplates ? { templates } : {}),
    ...(canSpaceTemplates ? { 'space-templates': spaceTemplates } : {}),
  };
  const scope = Object.prototype.hasOwnProperty.call(
    availableScopes,
    requestedScope,
  )
    ? requestedScope
    : Object.keys(availableScopes)[0];
  const hasVisitedMine = useRef(scope === 'mine');
  if (scope === 'mine') hasVisitedMine.current = true;

  // Direct scope links cannot mount a data source outside the authorized menus.
  useEffect(() => {
    if (!scope || requestedScope === scope) return;
    const next = new URLSearchParams(searchParams);
    if (scope === 'mine') next.delete('scope');
    else next.set('scope', scope);
    setSearchParams(next, { replace: true });
  }, [requestedScope, scope, searchParams, setSearchParams]);
  const isSpace = scope === 'space' || scope === 'space-templates';
  const isDiscovery = scope === 'discover' || scope === 'templates';
  const isTemplate = scope === 'templates' || scope === 'space-templates';

  const changeScope = (value: string) => {
    if (!Object.prototype.hasOwnProperty.call(availableScopes, value)) return;
    const next = new URLSearchParams(searchParams);
    if (value === 'mine') next.delete('scope');
    else next.set('scope', value);
    setSearchParams(next);
  };

  return (
    <section className={styles.catalog}>
      <ResourceTypeTabs />
      <div className={styles.toolbar}>
        <div className={styles.scopes} role="tablist">
          {canMine && (
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'mine'}
              onClick={() => changeScope('mine')}
            >
              {dict('PC.Components.ResourceCatalog.mine')}
            </button>
          )}
          {(canPublish || canSpaceTemplates) && (
            <button
              type="button"
              role="tab"
              aria-selected={isSpace}
              onClick={() =>
                changeScope(canPublish ? 'space' : 'space-templates')
              }
            >
              {dict('PC.Components.ResourceCatalog.inSpace')}
            </button>
          )}
          {(canDiscover || canTemplates) && (
            <button
              type="button"
              role="tab"
              aria-selected={isDiscovery}
              onClick={() =>
                changeScope(canDiscover ? 'discover' : 'templates')
              }
            >
              {dict('PC.Components.ResourceCatalog.discover')}
            </button>
          )}
        </div>
        {((isDiscovery && canTemplates && canDiscover) ||
          (isSpace && canSpaceTemplates && canPublish)) && (
          <div className={styles.modes}>
            <button
              type="button"
              aria-pressed={!isTemplate}
              onClick={() => changeScope(isSpace ? 'space' : 'discover')}
            >
              {dict('PC.Components.ResourceCatalog.resources')}
            </button>
            <button
              type="button"
              aria-pressed={isTemplate}
              onClick={() =>
                changeScope(isSpace ? 'space-templates' : 'templates')
              }
            >
              {dict('PC.Components.ResourceCatalog.templates')}
            </button>
          </div>
        )}
      </div>
      {canMine && (
        <div className={styles.panel} hidden={scope !== 'mine'} role="tabpanel">
          {hasVisitedMine.current && children}
        </div>
      )}
      {!scope && (
        <Empty description={dict('PC.Pages.SystemMenuManage.noPermission')} />
      )}
      {scope && scope !== 'mine' && (
        <div className={styles.panel} role="tabpanel" key={scope}>
          {availableScopes[scope as keyof typeof availableScopes]}
        </div>
      )}
    </section>
  );
};

export default ResourceCatalogScope;
