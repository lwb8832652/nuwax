import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import CardWrapper from '@/components/business-component/CardWrapper';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  IM_PLATFORM_ICON_MAP,
  IM_PLATFORM_LABEL_MAP,
  IMPlatformEnum,
} from '@/constants/imChannel.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeleteIMConfigChannel,
  apiGetQqChannelStatus,
  apiIMConfigChannelList,
  apiStartQqChannel,
  apiStopQqChannel,
} from '@/services/imChannel';
import {
  IMChannelInfo,
  IMChannelTypeEnum,
  QqChannelStatus,
} from '@/types/interfaces/imChannel';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Button, message, Modal, Switch, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface IMChannelCardListRef {
  reload: () => void;
}

export interface IMChannelCardListProps {
  onEdit: (info: IMChannelInfo) => void;
  onDeleteSuccess?: (channel: string) => void;
  platform?: string;
  spaceId?: number;
  keyword?: string;
}

const ConfigFieldValue: React.FC<{ record: IMChannelInfo }> = ({ record }) => {
  let configData: any = {};
  try {
    configData = JSON.parse(record.configData || '{}');
  } catch (e) {
    // 解析失败
  }

  const platform = record.channel;

  if (platform === IMPlatformEnum.Feishu) {
    return (
      <span
        style={{ color: '#828894', fontSize: 12 }}
        className="text-ellipsis"
      >
        AppID: {configData.appId || '-'}
      </span>
    );
  }
  if (platform === IMPlatformEnum.Dingtalk) {
    return (
      <span
        style={{ color: '#828894', fontSize: 12 }}
        className="text-ellipsis"
      >
        RobotCode: {configData.robotCode || '-'}
      </span>
    );
  }
  if (platform === IMPlatformEnum.Wework) {
    return (
      <span
        style={{ color: '#828894', fontSize: 12 }}
        className="text-ellipsis"
      >
        Token: {configData.token || '-'}
      </span>
    );
  }

  if (platform === IMPlatformEnum.WechatIlink) {
    return (
      <span
        style={{ color: '#828894', fontSize: 12 }}
        className="text-ellipsis"
      >
        BotID: {configData.ilinkAccountId || '-'}
      </span>
    );
  }

  if (platform === IMPlatformEnum.QQ) {
    return (
      <span
        style={{ color: '#828894', fontSize: 12 }}
        className="text-ellipsis"
      >
        AppID: {configData.botAppId || '-'}
      </span>
    );
  }

  return null;
};

const IMChannelCardList = forwardRef<
  IMChannelCardListRef,
  IMChannelCardListProps
>(({ onEdit, onDeleteSuccess, platform, spaceId, keyword = '' }, ref) => {
  const [loading, setLoading] = useState(false);
  const [allRobots, setAllRobots] = useState<IMChannelInfo[]>([]);
  // QQ 渠道后端为单连接，同一平台下所有卡片共用同一份连接状态
  const [qqStatus, setQqStatus] = useState<QqChannelStatus | null>(null);
  const [qqSwitching, setQqSwitching] = useState(false);
  const isQqPlatform = platform === IMPlatformEnum.QQ;

  const fetchData = useCallback(async () => {
    if (!platform) return; // 暂无平台，不请求列表
    setLoading(true);
    try {
      const res = await apiIMConfigChannelList({
        channel: platform || '',
        spaceId,
      });
      if (res.code === SUCCESS_CODE) {
        const list = res.data || [];
        setAllRobots(list);
      }
    } catch (error) {
      console.error('Fetch IMChannel List Failed:', error);
    } finally {
      setLoading(false);
    }
  }, [platform, spaceId]);

  const fetchQqStatus = useCallback(async () => {
    try {
      const res = await apiGetQqChannelStatus();
      if (res.code === SUCCESS_CODE) {
        setQqStatus(res.data ?? null);
      }
    } catch (error) {
      console.error('Fetch QQ channel status failed:', error);
    }
  }, []);

  // 仅在当前平台为 QQ 时开启 10 秒轮询，避免其他平台产生无意义请求
  useEffect(() => {
    if (!isQqPlatform) {
      setQqStatus(null);
      return;
    }
    fetchQqStatus();
    const timer = setInterval(fetchQqStatus, 10000);
    return () => clearInterval(timer);
  }, [isQqPlatform, fetchQqStatus]);

  const filteredRobotList = useMemo(() => {
    if (!keyword) return allRobots;
    const lowerKeyword = keyword.toLowerCase();
    return allRobots.filter(
      (item) =>
        (item.agentName || '').toLowerCase().includes(lowerKeyword) ||
        (item.name || '').toLowerCase().includes(lowerKeyword),
    );
  }, [allRobots, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useImperativeHandle(ref, () => ({
    reload: fetchData,
  }));

  // const handleToggleStatus = async (
  //   record: IMChannelInfo,
  //   checked: boolean,
  // ) => {
  //   setSwitchingIds((prev) => [...prev, record.id]);
  //   try {
  //     const res = await apiUpdateIMConfigChannelEnabled({
  //       id: record.id,
  //       enabled: checked,
  //     });
  //     if (res.code === SUCCESS_CODE) {
  //       message.success(`${checked ? '启用' : '停用'}成功`);
  //       // 更新本地数据
  //       setAllRobots((prev) =>
  //         prev.map((item) =>
  //           item.id === record.id ? { ...item, enabled: checked } : item,
  //         ),
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Toggle status failed:', error);
  //   } finally {
  //     setSwitchingIds((prev) => prev.filter((id) => id !== record.id));
  //   }
  // };

  const handleToggleQqConnection = async (checked: boolean) => {
    setQqSwitching(true);
    try {
      const res = checked
        ? await apiStartQqChannel()
        : await apiStopQqChannel();
      if (res.code === SUCCESS_CODE) {
        message.success(
          checked
            ? dict('PC.Pages.IMChannel.CardList.qqConnectSuccess')
            : dict('PC.Pages.IMChannel.CardList.qqDisconnectSuccess'),
        );
        setQqStatus(res.data ?? null);
        await fetchQqStatus();
      } else {
        message.error(
          res.message || dict('PC.Pages.IMChannel.CardList.qqConnectFailed'),
        );
      }
    } catch (error) {
      console.error('Toggle QQ connection failed:', error);
      message.error(dict('PC.Pages.IMChannel.CardList.qqConnectFailed'));
    } finally {
      setQqSwitching(false);
    }
  };

  const renderQqStatusTag = () => {
    if (!qqStatus) return null;
    if (!qqStatus.hasEnabledConfig) {
      return (
        <Tag color="default" style={{ marginRight: 0, flexShrink: 0 }}>
          {dict('PC.Pages.IMChannel.CardList.qqStatusNoConfig')}
        </Tag>
      );
    }
    if (qqStatus.connected && qqStatus.authenticated) {
      return (
        <Tag color="success" style={{ marginRight: 0, flexShrink: 0 }}>
          {dict('PC.Pages.IMChannel.CardList.qqStatusConnected')}
        </Tag>
      );
    }
    if (qqStatus.connected) {
      return (
        <Tag color="processing" style={{ marginRight: 0, flexShrink: 0 }}>
          {dict('PC.Pages.IMChannel.CardList.qqStatusConnecting')}
        </Tag>
      );
    }
    if (qqStatus.running) {
      const count = qqStatus.reconnectCount ?? 0;
      return (
        <Tooltip title={qqStatus.lastError}>
          <Tag color="warning" style={{ marginRight: 0, flexShrink: 0 }}>
            {dict('PC.Pages.IMChannel.CardList.qqStatusReconnecting')}
            {count > 0 ? ` (${count})` : ''}
          </Tag>
        </Tooltip>
      );
    }
    return (
      <Tooltip title={qqStatus.lastError}>
        <Tag style={{ marginRight: 0, flexShrink: 0 }}>
          {dict('PC.Pages.IMChannel.CardList.qqStatusDisconnected')}
        </Tag>
      </Tooltip>
    );
  };

  const handleDelete = (id: number, channel: string, title: string) => {
    Modal.confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content: dict('PC.Pages.IMChannel.CardList.deleteContent'),
      okText: dict('PC.Common.Global.confirm'),
      okType: 'danger',
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        try {
          const res = await apiDeleteIMConfigChannel(id);
          if (res.code === SUCCESS_CODE) {
            message.success(dict('PC.Toast.Global.deletedSuccessfully'));
            setAllRobots((prev) => prev.filter((item) => item.id !== id));
            onDeleteSuccess?.(channel);
          }
        } catch (error) {
          console.error('Delete IMChannel failed:', error);
        }
      },
    });
  };

  const renderCard = (record: IMChannelInfo) => {
    const platformIcon =
      IM_PLATFORM_ICON_MAP[record.channel as IMPlatformEnum] || '';

    const platformName =
      IM_PLATFORM_LABEL_MAP[record.channel as IMPlatformEnum] ||
      dict('PC.Pages.IMChannel.CardList.defaultPlatformName');
    // const isEnabled = record.enabled;
    const isBot = record.targetType === IMChannelTypeEnum.Bot;
    const typeLabel = isBot
      ? dict('PC.Pages.IMChannel.CardList.smartBot')
      : dict('PC.Pages.IMChannel.CardList.enterpriseApp');

    return (
      <CardWrapper
        key={record.id}
        className={cx(styles.card)}
        title={
          <div
            className={cx('flex', 'items-center')}
            style={{ width: '100%', gap: 8 }}
          >
            <span className="text-ellipsis" style={{ flex: 1 }}>
              {record.agentName ||
                dict('PC.Pages.IMChannel.CardList.unboundAgent')}
            </span>
            {record.channel === IMPlatformEnum.Wework && (
              <Tag
                color={isBot ? 'blue' : 'green'}
                style={{ marginRight: 0, flexShrink: 0 }}
              >
                {isBot
                  ? dict('PC.Pages.IMChannel.CardList.bot')
                  : dict('PC.Pages.IMChannel.CardList.app')}
              </Tag>
            )}
            {record.channel === IMPlatformEnum.QQ && renderQqStatusTag()}
          </div>
        }
        name={record.name}
        content={record.agentDescription || ''}
        icon={record.agentIcon || platformIcon}
        defaultIcon="" // Logic in CardWrapper fallback
        extra={
          <div className={cx(styles.extra)}>
            <span className={cx(styles.time)}>
              {dict('PC.Pages.IMChannel.CardList.lastEdited')}{' '}
              {dayjs(record.modified).format('MM-DD HH:mm')}
            </span>
          </div>
        }
        footer={
          <div className={cx(styles.footer)}>
            <ConfigFieldValue record={record} />

            {record.channel === IMPlatformEnum.QQ && (
              <Tooltip
                title={
                  qqStatus?.hasEnabledConfig
                    ? dict('PC.Pages.IMChannel.CardList.qqConnection')
                    : dict('PC.Pages.IMChannel.CardList.qqStatusNoConfig')
                }
              >
                <Switch
                  size="small"
                  checked={Boolean(qqStatus?.running)}
                  loading={qqSwitching}
                  disabled={!qqStatus?.hasEnabledConfig}
                  onChange={(checked) => handleToggleQqConnection(checked)}
                />
              </Tooltip>
            )}
            <div className={cx(styles.actions)}>
              <Tooltip title={dict('PC.Pages.IMChannel.CardList.edit')}>
                <Button
                  className="action-btn edit-btn"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(record);
                  }}
                />
              </Tooltip>
              <Tooltip title={dict('PC.Pages.IMChannel.CardList.delete')}>
                <Button
                  className="action-btn delete-btn"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(
                      record.id,
                      record.channel,
                      dict(
                        'PC.Pages.IMChannel.CardList.confirmDelete',
                        platformName,
                        typeLabel,
                      ),
                    );
                  }}
                />
              </Tooltip>
            </div>
          </div>
        }
      />
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (filteredRobotList.length === 0) {
    const isSearchEmpty = keyword && allRobots.length > 0;
    return (
      <div className={cx(styles.emptyWrapper)}>
        <AppDevEmptyState
          type="no-data"
          title={
            isSearchEmpty
              ? dict('PC.Pages.IMChannel.CardList.noMatchingResults')
              : dict('PC.Pages.IMChannel.CardList.noResultsFound')
          }
          description={
            isSearchEmpty
              ? dict('PC.Pages.IMChannel.CardList.noKeywordResults', keyword)
              : dict('PC.Pages.IMChannel.CardList.noRobotsDesc')
          }
        />
      </div>
    );
  }

  return (
    <div className={cx(styles.container, 'scroll-container-hide')}>
      <div className={cx(styles.list)}>{filteredRobotList.map(renderCard)}</div>
    </div>
  );
});

export default IMChannelCardList;
