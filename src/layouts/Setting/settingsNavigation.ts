import { MenuEnabledEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum } from '@/types/enums/space';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';

export const getEnabledSettingsMenus = (menus: MenuItemDto[]): MenuItemDto[] =>
  menus.flatMap((menu) => {
    if (menu.status !== MenuEnabledEnum.Enabled) return [];
    return [menu, ...getEnabledSettingsMenus(menu.children || [])];
  });

export const isComputerSettingsMenu = (menu: MenuItemDto) =>
  menu.code === 'my_computer' ||
  menu.path?.split('?')[0] === '/my-computer-manage';

export const isApiKeySettingsMenu = (menu: MenuItemDto) =>
  menu.code === 'api_key' || menu.path?.split('?')[0] === '/more-page/api-key';

export const isIMSettingsMenu = (menu: MenuItemDto) =>
  menu.code === 'im_channel' ||
  /^\/space\/[^/]+\/im-channel$/.test(menu.path?.split('?')[0] || '');

export const isSpaceModelSettingsMenu = (menu: MenuItemDto) =>
  menu.code === 'space_model_manage' ||
  /^\/space\/[^/]+\/model-manage$/.test(menu.path?.split('?')[0] || '');

export const canUseIMSpace = (menus: MenuItemDto[], spaceId: number) =>
  menus.some((menu) => {
    if (!isIMSettingsMenu(menu)) return false;
    const path = menu.path?.split('?')[0];
    // A parameterized menu is scoped to the user's server-provided space list.
    return (
      !path ||
      path === '/space/:spaceId/im-channel' ||
      path === `/space/${spaceId}/im-channel`
    );
  });

export const canUseModelSpace = (menus: MenuItemDto[], spaceId: number) =>
  menus.some((menu) => {
    if (!isSpaceModelSettingsMenu(menu)) return false;
    const path = menu.path?.split('?')[0];
    return (
      !path ||
      path === '/space/:spaceId/model-manage' ||
      path === `/space/${spaceId}/model-manage`
    );
  });

export const getCurrentSettingsSpace = (
  spaces: SpaceInfo[],
  currentSpace?: SpaceInfo,
  routeSpaceId?: unknown,
  storedSpaceId?: unknown,
) => {
  const findSpace = (value: unknown) => {
    const spaceId = Number(value);
    if (!Number.isFinite(spaceId) || spaceId <= 0) return undefined;
    return spaces.find((space) => space.id === spaceId);
  };

  return (
    findSpace(currentSpace?.id) ??
    findSpace(routeSpaceId) ??
    findSpace(storedSpaceId)
  );
};

export const canManageModelsInSpace = (
  menus: MenuItemDto[],
  space?: SpaceInfo,
) =>
  !!space &&
  !(
    space.currentUserRole === RoleEnum.User &&
    space.allowDevelop === AllowDevelopEnum.Not_Allow
  ) &&
  canUseModelSpace(menus, space.id);

export const getMoreSettingsMenus = (menus: MenuItemDto[]) => {
  const enabled = getEnabledSettingsMenus(menus);
  const candidates = [
    ...enabled
      .filter((menu) => menu.code === 'more_page')
      .flatMap((root) => getEnabledSettingsMenus([root])),
    ...enabled.filter((menu) => menu.path?.startsWith('/more-page/')),
  ];
  const visitedPaths = new Set<string>();

  return candidates.filter((menu) => {
    const path = menu.path?.trim();
    const pathname = path?.split('?')[0].replace(/\/$/, '');
    if (
      !path ||
      path === '#' ||
      pathname === '/more-page' ||
      isApiKeySettingsMenu(menu) ||
      visitedPaths.has(path)
    ) {
      return false;
    }
    visitedPaths.add(path);
    return true;
  });
};
