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
  deleteMember: vi.fn(),
  getMembers: vi.fn(),
}));

vi.mock('@/services/teamSetting', () => ({
  apiDeleteSpaceUser: mocks.deleteMember,
  apiGetSpaceUserList: mocks.getMembers,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/styles/teamSetting.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@/pages/TeamSetting/components/AddMember', () => ({
  default: ({ open }: { open: boolean }) => (
    <div data-testid="add-member-open">{String(open)}</div>
  ),
}));
vi.mock('@ant-design/icons', () => ({
  MoreOutlined: () => null,
  SearchOutlined: () => null,
}));
vi.mock('antd', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Button: ({ children, icon: _icon, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Empty: ({ description }: { description: React.ReactNode }) => (
    <div>{description}</div>
  ),
  Input: ({ onChange, value, placeholder }: any) => (
    <input
      aria-label="member-search"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
  Pagination: () => null,
  Popconfirm: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Spin: () => <span>loading</span>,
  message: { success: vi.fn() },
}));

import MemberManageTab from '@/pages/TeamSetting/components/MemberManageTab';
import { TeamStatusEnum } from '@/types/enums/teamSetting';

const members = [
  {
    userId: 1,
    spaceId: 7,
    userName: 'owner@example.com',
    nickName: '所有者',
    avatar: '',
    role: TeamStatusEnum.Owner,
    created: '2026-09-01T00:00:00.000Z',
  },
  {
    userId: 2,
    spaceId: 7,
    userName: 'member@example.com',
    nickName: '成员',
    avatar: '',
    role: TeamStatusEnum.User,
    created: '2026-09-02T00:00:00.000Z',
  },
];

describe('NewX prototype member list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMembers.mockImplementation(({ kw }: { kw: string }) =>
      Promise.resolve({
        code: '0000',
        data: kw
          ? members.filter((member) => member.userName.includes(kw))
          : members,
      }),
    );
  });

  afterEach(cleanup);

  it('keeps the member API search and reports the unfiltered member count', async () => {
    const onMemberCountChange = vi.fn();
    const onMemberRoleCountsChange = vi.fn();
    const { rerender } = render(
      <MemberManageTab
        spaceId={7}
        role={TeamStatusEnum.Owner}
        onMemberCountChange={onMemberCountChange}
        onMemberRoleCountsChange={onMemberRoleCountsChange}
      />,
    );

    await waitFor(() =>
      expect(mocks.getMembers).toHaveBeenCalledWith({
        spaceId: 7,
        role: undefined,
        kw: '',
      }),
    );
    expect(screen.getByText('2 位成员')).toBeInTheDocument();
    expect(onMemberCountChange).toHaveBeenLastCalledWith(2);
    expect(onMemberRoleCountsChange).toHaveBeenLastCalledWith({
      [TeamStatusEnum.Owner]: 1,
      [TeamStatusEnum.Admin]: 0,
      [TeamStatusEnum.User]: 1,
    });

    fireEvent.change(screen.getByLabelText('member-search'), {
      target: { value: 'member' },
    });
    await waitFor(() =>
      expect(mocks.getMembers).toHaveBeenLastCalledWith({
        spaceId: 7,
        role: undefined,
        kw: 'member',
      }),
    );
    expect(screen.getByText('1 位成员')).toBeInTheDocument();
    expect(onMemberCountChange).toHaveBeenLastCalledWith(2);

    rerender(
      <MemberManageTab
        spaceId={7}
        role={TeamStatusEnum.Owner}
        inviteRequest={1}
        onMemberCountChange={onMemberCountChange}
        onMemberRoleCountsChange={onMemberRoleCountsChange}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('add-member-open')).toHaveTextContent('true'),
    );
  });
});
