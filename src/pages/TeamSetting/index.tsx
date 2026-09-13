import { PATH_URL, SPACE_ID } from '@/constants/home.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetSpaceDetail, apiUpdateSpaceTeam } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { SpaceTypeEnum } from '@/types/enums/space';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type {
  TeamDetailInfo,
  UpdateSpaceTeamParams,
} from '@/types/interfaces/teamSetting';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { FormOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import MemberManageTab from './components/MemberManageTab';
import ModifyTeam from './components/ModifyTeam';
import SpaceSettingTab from './components/SpaceSettingTab';

export type TabKey = 'MemberManage' | 'RoleOverview' | 'SpaceSetting';

type RoleCounts = Record<TeamStatusEnum, number>;

const EMPTY_ROLE_COUNTS: RoleCounts = {
  [TeamStatusEnum.Owner]: 0,
  [TeamStatusEnum.Admin]: 0,
  [TeamStatusEnum.User]: 0,
};

const formatCreatedAt = (created?: string) => {
  if (!created) return '';

  const date = new Date(created);
  if (Number.isNaN(date.getTime())) return '';

  return `创建于 ${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
};

const RoleOverview: React.FC<{ counts: RoleCounts }> = ({ counts }) => {
  const roles = [
    {
      role: TeamStatusEnum.Owner,
      description: '空间的最高权限，负责空间设置及成员管理。',
    },
    {
      role: TeamStatusEnum.Admin,
      description: '可管理成员和空间内的团队资源。',
    },
    {
      role: TeamStatusEnum.User,
      description: '可使用已授权资源，并参与空间内协作。',
    },
  ];

  const roleName = (role: TeamStatusEnum) => {
    if (role === TeamStatusEnum.Owner) {
      return dict('PC.Pages.TeamSetting.roleOwner');
    }
    if (role === TeamStatusEnum.Admin) {
      return dict('PC.Pages.TeamSetting.roleAdmin');
    }
    return dict('PC.Pages.TeamSetting.roleMember');
  };

  return (
    <div className={styles['roles-panel']}>
      {roles.map(({ role, description }) => (
        <article className={styles['role-row']} key={role}>
          <div>
            <strong>{roleName(role)}</strong>
            <p>{description}</p>
          </div>
          <span>{counts[role]} 位成员</span>
        </article>
      ))}
    </div>
  );
};

const TeamSetting: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const [activeTab, setActiveTab] = useState<TabKey>('MemberManage');
  const [memberCount, setMemberCount] = useState(0);
  const [roleCounts, setRoleCounts] = useState<RoleCounts>(EMPTY_ROLE_COUNTS);
  const [inviteRequest, setInviteRequest] = useState(0);
  const [openModifyTeamModal, setOpenModifyTeamModal] = useState(false);
  const [spaceDetailInfo, setSpaceDetailInfo] = useState<TeamDetailInfo>();
  const { spaceList, setSpaceList, setCurrentSpaceInfo } =
    useModel('spaceModel');

  const selectedSpace = useMemo(
    () =>
      spaceList?.find((item: SpaceInfo) => item.id === spaceId) as
        | SpaceInfo
        | undefined,
    [spaceId, spaceList],
  );
  const isPersonalSpace = selectedSpace?.type === SpaceTypeEnum.Personal;
  const canManageMembers = Boolean(
    spaceDetailInfo && spaceDetailInfo.currentUserRole !== TeamStatusEnum.User,
  );
  const canManageSettings =
    spaceDetailInfo?.currentUserRole === TeamStatusEnum.Owner;
  const spaceName = spaceDetailInfo?.name || selectedSpace?.name || '个人空间';
  const createdLabel = formatCreatedAt(
    spaceDetailInfo?.created || selectedSpace?.created,
  );

  const { run } = useRequest(apiGetSpaceDetail, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: TeamDetailInfo) => {
      setSpaceDetailInfo(result);
    },
  });

  const { run: runEdit } = useRequest(apiUpdateSpaceTeam, {
    manual: true,
    onSuccess: (_: null, updateParams: UpdateSpaceTeamParams[]) => {
      message.success(dict('PC.Toast.Global.modifiedSuccessfully'));
      const detail = {
        ...spaceDetailInfo,
        ...updateParams[0],
      } as TeamDetailInfo;
      setSpaceDetailInfo(detail);
    },
  });

  const handleChange = (attr: string, checked: boolean) => {
    runEdit({
      id: spaceId,
      [attr]: checked ? 1 : 0,
    });
  };

  const handleTransferSuccess = async () => {
    localStorage.removeItem('SPACE_ID');
    localStorage.removeItem(PATH_URL);
    const newSpaceList =
      spaceList?.filter((item: SpaceInfo) => item.id !== spaceId) || [];
    setSpaceList(newSpaceList);
    const defaultSpace = newSpaceList.find(
      (item: SpaceInfo) => item.type === SpaceTypeEnum.Personal,
    );
    setCurrentSpaceInfo(defaultSpace);
    const id = defaultSpace?.id || newSpaceList[0]?.id;
    localStorage.setItem(SPACE_ID, String(id));
    history.push(`/space/${id}/develop`);
  };

  const handlerConfirmModifyTeam = () => {
    setOpenModifyTeamModal(false);
    run(spaceId);
  };

  const openMemberInvite = () => {
    setActiveTab('MemberManage');
    setInviteRequest((current) => current + 1);
  };

  useEffect(() => {
    setActiveTab('MemberManage');
    setMemberCount(0);
    setRoleCounts(EMPTY_ROLE_COUNTS);
    run(spaceId);
  }, [spaceId]);

  return (
    <main
      className={classNames(styles['team-setting-container'], 'overflow-y')}
    >
      <header className={styles['space-page-head']}>
        <div>
          <p className={styles.overline}>
            {isPersonalSpace ? 'PERSONAL SPACE' : 'TEAM WORKSPACE'}
          </p>
          <h1>空间管理</h1>
          <p className={styles['page-description']}>
            {isPersonalSpace
              ? '管理个人空间的基础信息与可用功能。'
              : '管理当前空间的成员、角色与基础信息。'}
          </p>
        </div>
        {canManageMembers && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles['invite-member-button']}
            onClick={openMemberInvite}
          >
            邀请成员
          </Button>
        )}
      </header>

      <section className={styles['space-summary']}>
        <span className={styles['space-large-mark']} aria-hidden="true">
          {spaceDetailInfo?.icon || selectedSpace?.icon ? (
            <img src={spaceDetailInfo?.icon || selectedSpace?.icon} alt="" />
          ) : (
            spaceName.trim().slice(0, 1) || '空'
          )}
        </span>
        <div className={styles['space-summary-name']}>
          <div>
            <strong>{spaceName}</strong>
            {canManageMembers && (
              <Button
                type="text"
                size="small"
                icon={<FormOutlined />}
                className={styles['edit-space-button']}
                title={dict('PC.Pages.TeamSetting.ModifyTeam.editTeamProfile')}
                aria-label={dict(
                  'PC.Pages.TeamSetting.ModifyTeam.editTeamProfile',
                )}
                onClick={() => setOpenModifyTeamModal(true)}
              />
            )}
          </div>
          <small>
            {isPersonalSpace ? '个人空间' : '团队空间'} · {memberCount} 位成员
          </small>
        </div>
        {createdLabel && (
          <span className={styles['space-created']}>{createdLabel}</span>
        )}
      </section>

      <nav className={styles['space-tabs']} aria-label="空间管理">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'MemberManage'}
          className={classNames({
            [styles.selected]: activeTab === 'MemberManage',
          })}
          onClick={() => setActiveTab('MemberManage')}
        >
          成员
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'RoleOverview'}
          className={classNames({
            [styles.selected]: activeTab === 'RoleOverview',
          })}
          onClick={() => setActiveTab('RoleOverview')}
        >
          角色
        </button>
        {canManageSettings && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'SpaceSetting'}
            className={classNames({
              [styles.selected]: activeTab === 'SpaceSetting',
            })}
            onClick={() => setActiveTab('SpaceSetting')}
          >
            {dict('PC.Pages.TeamSetting.spaceSetting')}
          </button>
        )}
      </nav>

      <section className={styles['space-tab-content']}>
        {activeTab === 'MemberManage' ? (
          <MemberManageTab
            spaceId={spaceId}
            role={spaceDetailInfo?.currentUserRole}
            inviteRequest={inviteRequest}
            onMemberCountChange={setMemberCount}
            onMemberRoleCountsChange={setRoleCounts}
          />
        ) : activeTab === 'RoleOverview' ? (
          <RoleOverview counts={roleCounts} />
        ) : (
          <SpaceSettingTab
            spaceId={spaceId}
            spaceDetailInfo={spaceDetailInfo}
            onTransferSuccess={handleTransferSuccess}
            onChange={handleChange}
          />
        )}
      </section>

      <ModifyTeam
        spaceData={spaceDetailInfo}
        spaceId={spaceId}
        open={openModifyTeamModal}
        onCancel={() => setOpenModifyTeamModal(false)}
        onConfirmEdit={handlerConfirmModifyTeam}
      />
    </main>
  );
};

export default TeamSetting;
