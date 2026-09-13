import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  detail: undefined as Record<string, unknown> | undefined,
  getSpaceDetail: vi.fn(),
  updateSpace: vi.fn(),
  historyPush: vi.fn(),
  params: { spaceId: '1' },
  setCurrentSpaceInfo: vi.fn(),
  setSpaceList: vi.fn(),
  spaceList: [] as Record<string, unknown>[],
}));

vi.mock('@/services/teamSetting', () => ({
  apiGetSpaceDetail: mocks.getSpaceDetail,
  apiUpdateSpaceTeam: mocks.updateSpace,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('umi', () => ({
  history: { push: mocks.historyPush },
  useModel: () => ({
    spaceList: mocks.spaceList,
    setCurrentSpaceInfo: mocks.setCurrentSpaceInfo,
    setSpaceList: mocks.setSpaceList,
  }),
  useParams: () => mocks.params,
  useRequest: (service: unknown, options?: { onSuccess?: Function }) => ({
    run: (...args: unknown[]) => {
      if (service === mocks.getSpaceDetail) {
        mocks.getSpaceDetail(...args);
        options?.onSuccess?.(mocks.detail);
      }
      if (service === mocks.updateSpace) {
        mocks.updateSpace(...args);
        options?.onSuccess?.(null, args);
      }
    },
  }),
}));
vi.mock('antd', () => ({
  Button: ({ children, icon: _icon, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  message: { success: vi.fn() },
}));
vi.mock('@ant-design/icons', () => ({
  FormOutlined: () => null,
  PlusOutlined: () => null,
}));
vi.mock('@/styles/teamSetting.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@/pages/TeamSetting/components/MemberManageTab', () => ({
  default: ({ inviteRequest, onMemberCountChange }: any) => (
    <section data-testid="member-manage" data-invite-request={inviteRequest}>
      <button type="button" onClick={() => onMemberCountChange?.(3)}>
        report-member-count
      </button>
    </section>
  ),
}));
vi.mock('@/pages/TeamSetting/components/SpaceSettingTab', () => ({
  default: () => <section data-testid="space-settings" />,
}));
vi.mock('@/pages/TeamSetting/components/ModifyTeam', () => ({
  default: () => null,
}));

import TeamSetting from '@/pages/TeamSetting';
import { SpaceTypeEnum } from '@/types/enums/space';
import { TeamStatusEnum } from '@/types/enums/teamSetting';

describe('NewX space management page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = { spaceId: '1' };
    mocks.spaceList = [
      {
        id: 1,
        name: '个人空间',
        type: SpaceTypeEnum.Personal,
        created: '2026-09-01T00:00:00.000Z',
      },
    ];
    mocks.detail = {
      id: 1,
      name: '个人空间',
      description: '',
      icon: '',
      created: '2026-09-01T00:00:00.000Z',
      currentUserRole: TeamStatusEnum.Owner,
    };
  });

  afterEach(cleanup);

  it('uses the prototype-style personal space header and keeps member actions', async () => {
    render(<TeamSetting />);

    await waitFor(() => expect(mocks.getSpaceDetail).toHaveBeenCalledWith(1));

    expect(screen.getByText('PERSONAL SPACE')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '空间管理' }),
    ).toBeInTheDocument();
    expect(screen.getByText('成员')).toBeInTheDocument();
    expect(screen.getByText('角色')).toBeInTheDocument();
    expect(
      screen.getByText('PC.Pages.TeamSetting.spaceSetting'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '邀请成员' }));
    expect(screen.getByTestId('member-manage')).toHaveAttribute(
      'data-invite-request',
      '1',
    );

    fireEvent.click(screen.getByText('report-member-count'));
    expect(screen.getByText('个人空间 · 3 位成员')).toBeInTheDocument();

    fireEvent.click(screen.getByText('角色'));
    expect(
      screen.getByText('空间的最高权限，负责空间设置及成员管理。'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('PC.Pages.TeamSetting.spaceSetting'));
    expect(screen.getByTestId('space-settings')).toBeInTheDocument();
  });

  it('does not expose owner controls to a regular member', async () => {
    mocks.detail = {
      ...mocks.detail,
      currentUserRole: TeamStatusEnum.User,
    };

    render(<TeamSetting />);

    await waitFor(() => expect(mocks.getSpaceDetail).toHaveBeenCalledWith(1));

    expect(screen.queryByRole('button', { name: '邀请成员' })).toBeNull();
    expect(screen.queryByText('PC.Pages.TeamSetting.spaceSetting')).toBeNull();
  });
});
