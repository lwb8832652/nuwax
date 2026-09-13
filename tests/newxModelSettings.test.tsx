import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  historyState: undefined as unknown,
  params: {} as Record<string, string>,
  runComponent: vi.fn(),
  setSearchParams: vi.fn(),
  spaceModel: {} as Record<string, unknown>,
}));

vi.mock('umi', () => ({
  history: {
    location: {
      get state() {
        return mocks.historyState;
      },
    },
  },
  useModel: (name: string) =>
    name === 'spaceModel' ? mocks.spaceModel : { userInfo: { id: 10 } },
  useParams: () => mocks.params,
  useRequest: (service: unknown) => ({
    run: (...args: unknown[]) => {
      if (service === componentListService) mocks.runComponent(...args);
    },
  }),
  useSearchParams: () => [
    new URLSearchParams('keyword=route'),
    mocks.setSearchParams,
  ],
}));

const componentListService = vi.hoisted(() => vi.fn());

vi.mock('@/services/library', () => ({
  apiComponentList: componentListService,
}));
vi.mock('@/services/modelConfig', () => ({ apiModelDelete: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/ant-custom', () => ({ modalConfirm: vi.fn() }));
vi.mock('@/utils/exportImportFile', () => ({ exportConfigFile: vi.fn() }));
vi.mock('@/constants/space.constants', () => ({
  CREATE_LIST: [{ label: 'mine', value: 2 }],
}));
vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
  SearchOutlined: () => null,
}));
vi.mock('antd', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Empty: ({ description }: { description: React.ReactNode }) => (
    <div>{description}</div>
  ),
  Input: ({
    onChange,
    value,
  }: {
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    value?: string;
  }) => <input aria-label="model-search" value={value} onChange={onChange} />,
  message: { success: vi.fn() },
}));
vi.mock('@/components/ButtonToggle', () => ({
  default: ({ onChange }: { onChange: (value: number) => void }) => (
    <button type="button" onClick={() => onChange(2)}>
      filter-mine
    </button>
  ),
}));
vi.mock('@/components/ConditionRender', () => ({
  default: ({ condition, children }: any) => (condition ? children : null),
}));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/pages/SpaceLibrary/ComponentItem', () => ({ default: () => null }));
vi.mock('@/pages/SpaceLibrary/CreateModel', () => ({ default: () => null }));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({
    title,
    leftSlot,
    rightSlot,
    children,
  }: {
    title?: React.ReactNode;
    leftSlot?: React.ReactNode;
    rightSlot?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <section data-testid="settings-workspace-layout">
      <h3>{title}</h3>
      <div data-testid="settings-workspace-left-slot">{leftSlot}</div>
      <div data-testid="settings-workspace-right-slot">{rightSlot}</div>
      {children}
    </section>
  ),
}));
vi.mock('@/layouts/Setting/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@/pages/SpaceResource/ModelManage/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

import ModelSettings from '@/layouts/Setting/ModelSettings';
import SpaceModelManage from '@/pages/SpaceResource/ModelManage';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum } from '@/types/enums/space';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';

const space = (
  id: number,
  currentUserRole = RoleEnum.Owner,
  allowDevelop = AllowDevelopEnum.Allow,
) => ({ id, currentUserRole, allowDevelop } as SpaceInfo);

describe('NewX model settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.historyState = { refresh: true };
    mocks.params = {};
    mocks.spaceModel = {
      currentSpaceInfo: { id: 1 },
      getSpaceId: () => 1,
      runSpace: vi.fn(),
      setSpaceList: vi.fn(),
      spaceList: [
        { id: 1, name: 'Current space' },
        { id: 2, name: 'Route space' },
      ],
    };
  });
  afterEach(cleanup);

  it('uses the current space without rendering a duplicate selector', async () => {
    const menus = [
      {
        code: 'space_model_manage',
        path: '/space/:spaceId/model-manage',
      },
    ] as MenuItemDto[];

    render(<ModelSettings menus={menus} space={space(2)} />);

    expect(screen.queryByLabelText('settings-model-space')).toBeNull();
    expect(screen.getByTestId('settings-workspace-layout')).toHaveTextContent(
      'PC.Pages.SpaceModelManage.pageTitle',
    );
    await waitFor(() => expect(mocks.runComponent).toHaveBeenCalledWith(2));
    expect(mocks.setSearchParams).not.toHaveBeenCalled();
  });

  it('does not load another workspace when the current one is unauthorized', () => {
    const menus = [
      {
        code: 'space_model_manage',
        path: '/space/7/model-manage',
      },
    ] as MenuItemDto[];

    render(<ModelSettings menus={menus} space={space(1)} />);

    expect(mocks.runComponent).not.toHaveBeenCalled();
    expect(
      screen.getByText('PC.Pages.Setting.noAvailableSpace'),
    ).toBeInTheDocument();
  });

  it('does not expose model management when development is disabled', () => {
    const menus = [
      {
        code: 'space_model_manage',
        path: '/space/:spaceId/model-manage',
      },
    ] as MenuItemDto[];

    render(
      <ModelSettings
        menus={menus}
        space={space(1, RoleEnum.User, AllowDevelopEnum.Not_Allow)}
      />,
    );

    expect(mocks.runComponent).not.toHaveBeenCalled();
    expect(
      screen.getByText('PC.Pages.Setting.noAvailableSpace'),
    ).toBeInTheDocument();
  });

  it('keeps embedded filters local even when route state is present', async () => {
    render(<SpaceModelManage spaceId={7} embedded />);

    await waitFor(() => expect(mocks.runComponent).toHaveBeenCalledWith(7));
    fireEvent.click(screen.getByRole('button', { name: 'filter-mine' }));
    fireEvent.change(screen.getByLabelText('model-search'), {
      target: { value: 'local' },
    });
    expect(mocks.setSearchParams).not.toHaveBeenCalled();
  });

  it('keeps filters and model actions in the same embedded toolbar', () => {
    render(<SpaceModelManage spaceId={7} embedded />);

    const toolbar = screen.getByTestId('settings-workspace-left-slot');
    expect(toolbar).toHaveTextContent('filter-mine');
    expect(screen.getByLabelText('model-search')).toBeInTheDocument();
    expect(toolbar).toHaveTextContent('PC.Pages.SpaceLibrary.Index.addModel');
    expect(
      screen.getByTestId('settings-workspace-right-slot'),
    ).toBeEmptyDOMElement();
  });

  it('does not request models without a valid space ID', () => {
    render(<SpaceModelManage spaceId={Number.NaN} embedded />);

    expect(mocks.runComponent).not.toHaveBeenCalled();
  });
});
