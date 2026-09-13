import personalImage from '@/assets/images/personal.png';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeleteSpaceUser,
  apiGetSpaceUserList,
} from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type { SpaceUserInfo } from '@/types/interfaces/teamSetting';
import { MoreOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Pagination,
  Popconfirm,
  Spin,
  message,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddMember from './AddMember';

const cx = (className: string) => styles[className] || className;
const PAGE_SIZE = 10;

interface MemberManageTabProps {
  spaceId: number;
  role: TeamStatusEnum | undefined;
  /** An incrementing value from the page header opens the invite modal. */
  inviteRequest?: number;
  onMemberCountChange?: (count: number) => void;
  onMemberRoleCountsChange?: (counts: Record<TeamStatusEnum, number>) => void;
}

const getRoleLabel = (role: TeamStatusEnum) => {
  if (role === TeamStatusEnum.Owner) {
    return dict('PC.Pages.TeamSetting.roleOwner');
  }
  if (role === TeamStatusEnum.Admin) {
    return dict('PC.Pages.TeamSetting.roleAdmin');
  }
  return dict('PC.Pages.TeamSetting.roleMember');
};

const formatJoinedAt = (created: string) => {
  const date = new Date(created);
  if (Number.isNaN(date.getTime())) {
    return created;
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const MemberManageTab: React.FC<MemberManageTabProps> = ({
  spaceId,
  role,
  inviteRequest = 0,
  onMemberCountChange,
  onMemberRoleCountsChange,
}) => {
  const [members, setMembers] = useState<SpaceUserInfo[]>([]);
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number>();
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const latestRequest = useRef(0);
  const lastInviteRequest = useRef(inviteRequest);
  const canManageMembers = role !== undefined && role !== TeamStatusEnum.User;

  const loadMembers = useCallback(
    async (searchKeyword: string) => {
      const requestId = ++latestRequest.current;
      setLoading(true);

      try {
        const res = await apiGetSpaceUserList({
          spaceId,
          role: undefined,
          kw: searchKeyword.trim(),
        });

        if (requestId !== latestRequest.current) {
          return;
        }

        const nextMembers = res.code === SUCCESS_CODE ? res.data || [] : [];
        setMembers(nextMembers);
        if (!searchKeyword.trim()) {
          onMemberCountChange?.(nextMembers.length);
          onMemberRoleCountsChange?.(
            nextMembers.reduce(
              (counts, member) => ({
                ...counts,
                [member.role]: counts[member.role] + 1,
              }),
              {
                [TeamStatusEnum.Owner]: 0,
                [TeamStatusEnum.Admin]: 0,
                [TeamStatusEnum.User]: 0,
              },
            ),
          );
        }
      } catch {
        if (requestId === latestRequest.current) {
          setMembers([]);
          if (!searchKeyword.trim()) {
            onMemberCountChange?.(0);
            onMemberRoleCountsChange?.({
              [TeamStatusEnum.Owner]: 0,
              [TeamStatusEnum.Admin]: 0,
              [TeamStatusEnum.User]: 0,
            });
          }
        }
      } finally {
        if (requestId === latestRequest.current) {
          setLoading(false);
        }
      }
    },
    [onMemberCountChange, onMemberRoleCountsChange, spaceId],
  );

  useEffect(() => {
    setCurrentPage(1);
    const timer = window.setTimeout(
      () => void loadMembers(keyword),
      keyword ? 250 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [keyword, loadMembers]);

  useEffect(() => {
    if (inviteRequest !== lastInviteRequest.current && canManageMembers) {
      setOpenAddMemberModal(true);
    }
    lastInviteRequest.current = inviteRequest;
  }, [canManageMembers, inviteRequest]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, members.length]);

  const visibleMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return members.slice(start, start + PAGE_SIZE);
  }, [currentPage, members]);

  const removeUser = async (userId: number) => {
    setDeletingUserId(userId);
    try {
      const resp = await apiDeleteSpaceUser({ userId, spaceId });
      if (resp.code === SUCCESS_CODE) {
        message.success(dict('PC.Toast.Global.deletedSuccessfully'));
        await loadMembers(keyword);
      }
    } finally {
      setDeletingUserId(undefined);
    }
  };

  const handleConfirmAddMember = () => {
    setOpenAddMemberModal(false);
    void loadMembers(keyword);
  };

  return (
    <section className={cx('member-manage')}>
      <div className={cx('members-toolbar')}>
        <div className={cx('members-toolbar-title')}>
          <span>{members.length} 位成员</span>
        </div>
        <Input
          allowClear
          className={cx('members-search')}
          placeholder={dict('PC.Pages.TeamSetting.MemberManageTab.search')}
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <div className={cx('member-list')}>
        {loading ? (
          <div className={cx('member-list-loading')}>
            <Spin />
          </div>
        ) : visibleMembers.length ? (
          visibleMembers.map((member) => {
            const displayName = member.nickName || member.userName;
            return (
              <div className={cx('member-row')} key={member.userId}>
                <Avatar
                  className={cx('member-avatar')}
                  size={28}
                  src={member.avatar || personalImage}
                >
                  {displayName.slice(0, 1)}
                </Avatar>
                <div className={cx('member-identity')}>
                  <strong>{displayName}</strong>
                  <span>{member.userName}</span>
                </div>
                <span className={cx('member-role')}>
                  {getRoleLabel(member.role)}
                </span>
                <time className={cx('member-time')}>
                  {formatJoinedAt(member.created)}
                </time>
                {canManageMembers && (
                  <Popconfirm
                    cancelText={dict('PC.Common.Global.cancel')}
                    okText={dict('PC.Common.Global.confirm')}
                    title={dict(
                      'PC.Pages.TeamSetting.MemberManageTab.confirmDelete',
                    )}
                    description={dict(
                      'PC.Pages.TeamSetting.MemberManageTab.confirmDeleteUser',
                    )}
                    onConfirm={() => removeUser(member.userId)}
                  >
                    <Button
                      aria-label={dict(
                        'PC.Pages.TeamSetting.MemberManageTab.delete',
                      )}
                      className={cx('member-delete')}
                      icon={<MoreOutlined />}
                      loading={deletingUserId === member.userId}
                      title={dict(
                        'PC.Pages.TeamSetting.MemberManageTab.delete',
                      )}
                      type="text"
                    />
                  </Popconfirm>
                )}
              </div>
            );
          })
        ) : (
          <Empty
            className={cx('member-empty')}
            description={dict('PC.Common.Global.noData')}
          />
        )}
      </div>

      {members.length > PAGE_SIZE && (
        <div className={cx('members-pagination')}>
          <Pagination
            current={currentPage}
            hideOnSinglePage
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            total={members.length}
            onChange={setCurrentPage}
          />
        </div>
      )}

      <AddMember
        spaceId={spaceId}
        open={openAddMemberModal}
        onCancel={() => setOpenAddMemberModal(false)}
        onConfirmAdd={handleConfirmAddMember}
      />
    </section>
  );
};

export default MemberManageTab;
