import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum } from '@/types/enums/space';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { describe, expect, it } from 'vitest';
import {
  canManageModelsInSpace,
  canUseIMSpace,
  canUseModelSpace,
  getCurrentSettingsSpace,
  getEnabledSettingsMenus,
  getMoreSettingsMenus,
  isApiKeySettingsMenu,
  isSpaceModelSettingsMenu,
} from './settingsNavigation';

const menu = (overrides: Partial<MenuItemDto>): MenuItemDto => ({
  id: 1,
  name: 'Menu',
  status: 1,
  menuBindType: 0,
  ...overrides,
});
const space = (
  id: number,
  currentUserRole = RoleEnum.Owner,
  allowDevelop = AllowDevelopEnum.Allow,
) => ({ id, currentUserRole, allowDevelop } as SpaceInfo);

describe('settings navigation permissions', () => {
  it('excludes disabled entries and children of disabled ancestors', () => {
    const menus = [
      menu({ id: 1, status: 0, children: [menu({ id: 2, code: 'api_key' })] }),
      menu({ id: 3, code: 'my_computer' }),
      menu({ id: 4, status: 0, code: 'im_channel' }),
    ];

    expect(getEnabledSettingsMenus(menus).map((item) => item.id)).toEqual([3]);
  });

  it('preserves authorized extension menus when relocating More', () => {
    const menus = [
      menu({
        code: 'more_page',
        children: [
          menu({ id: 2, path: '/more-page/api-key' }),
          menu({ id: 3, path: '/more-page/api-key-logs' }),
          menu({ id: 4, path: '/more-page/custom-report' }),
          menu({ id: 5, status: 0, path: '/more-page/restricted' }),
        ],
      }),
    ];

    expect(getMoreSettingsMenus(menus).map((item) => item.id)).toEqual([3, 4]);
    expect(
      isApiKeySettingsMenu(menu({ path: '/more-page/api-key-logs' })),
    ).toBe(false);
  });

  it('keeps concrete IM permissions restricted to the granted space', () => {
    const scoped = [menu({ code: 'im_channel', path: '/space/7/im-channel' })];
    const parameterized = [
      menu({ code: 'im_channel', path: '/space/:spaceId/im-channel' }),
    ];

    expect(canUseIMSpace(scoped, 7)).toBe(true);
    expect(canUseIMSpace(scoped, 8)).toBe(false);
    expect(canUseIMSpace(parameterized, 8)).toBe(true);
    expect(canUseIMSpace([], 8)).toBe(false);
  });

  it('keeps space model permissions restricted to their authorized spaces', () => {
    const scoped = [
      menu({ code: 'space_model_manage', path: '/space/7/model-manage' }),
    ];
    const parameterized = [
      menu({
        code: 'space_model_manage',
        path: '/space/:spaceId/model-manage',
      }),
    ];

    expect(canUseModelSpace(scoped, 7)).toBe(true);
    expect(canUseModelSpace(scoped, 8)).toBe(false);
    expect(canUseModelSpace(parameterized, 8)).toBe(true);
    expect(canUseModelSpace([], 8)).toBe(false);
    expect(
      isSpaceModelSettingsMenu(
        menu({ code: 'model_manage', path: '/system/model-manage' }),
      ),
    ).toBe(false);
  });

  it('uses only a workspace from the authorized space list', () => {
    const spaces = [space(1), space(2)];

    expect(getCurrentSettingsSpace(spaces, spaces[0], '2', '2')?.id).toBe(1);
    expect(getCurrentSettingsSpace(spaces, undefined, '999', '2')?.id).toBe(2);
    expect(getCurrentSettingsSpace(spaces, undefined, '999', '998')).toBe(
      undefined,
    );
  });

  it('preserves the disabled development restriction for ordinary members', () => {
    const menus = [
      menu({
        code: 'space_model_manage',
        path: '/space/:spaceId/model-manage',
      }),
    ];

    expect(canManageModelsInSpace(menus, space(1))).toBe(true);
    expect(
      canManageModelsInSpace(
        menus,
        space(1, RoleEnum.User, AllowDevelopEnum.Not_Allow),
      ),
    ).toBe(false);
  });

  it('keeps navigable parents and routes outside More without duplicates', () => {
    const menus = [
      menu({
        code: 'more_page',
        path: '/more-page',
        children: [
          menu({
            id: 2,
            path: '/more-page/reports',
            children: [menu({ id: 3, path: '/more-page/reports/monthly' })],
          }),
          menu({ id: 4, path: '#', children: [] }),
        ],
      }),
      menu({ id: 5, path: '/more-page/external-report' }),
      menu({ id: 6, path: '/more-page/reports' }),
      menu({
        id: 7,
        status: 0,
        children: [menu({ id: 8, path: '/more-page/restricted-report' })],
      }),
    ];

    expect(getMoreSettingsMenus(menus).map((item) => item.id)).toEqual([
      2, 3, 5,
    ]);
  });

  it('keeps a More root with a concrete destination as well as its children', () => {
    const menus = [
      menu({
        code: 'more_page',
        path: '/more-page/overview',
        children: [menu({ id: 2, path: '/more-page/details' })],
      }),
    ];

    expect(getMoreSettingsMenus(menus).map((item) => item.id)).toEqual([1, 2]);
  });
});
