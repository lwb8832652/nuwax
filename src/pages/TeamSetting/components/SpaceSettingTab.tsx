import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import styles from '@/styles/teamSetting.less';
import { AllowDevelopEnum, ReceivePublishEnum } from '@/types/enums/space';
import type { TeamDetailInfo } from '@/types/interfaces/teamSetting';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Switch } from 'antd';
import React, { useState } from 'react';
import RemoveSpace from './RemoveSpace';
import TransferSpace from './TransferSpace';

interface SpaceSettingTabProps {
  spaceId: number;
  spaceDetailInfo?: TeamDetailInfo;
  onTransferSuccess: () => void;
  onChange: (attr: string, checked: boolean) => void;
}

const SpaceSettingTab: React.FC<SpaceSettingTabProps> = ({
  spaceId,
  spaceDetailInfo,
  onTransferSuccess,
  onChange,
}) => {
  const [openRemoveModal, setOpenRemoveModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);

  const handlerConfirmRemove = async () => {
    setOpenRemoveModal(false);
    onTransferSuccess();
  };

  const handlerConfirmTransfer = () => {
    setOpenTransferModal(false);
    onTransferSuccess();
  };

  return (
    <div className={styles['space-settings-panel']}>
      <section className={styles['setting-group']}>
        <div>
          <h3>{dict('PC.Pages.TeamSetting.SpaceSettingTab.transferSpace')}</h3>
          <p>
            {dict(
              'PC.Pages.TeamSetting.SpaceSettingTab.transferSpaceDescription',
            )}
          </p>
        </div>
        <Button type="primary" onClick={() => setOpenTransferModal(true)}>
          {dict('PC.Pages.TeamSetting.SpaceSettingTab.transferSpaceBtn')}
        </Button>
      </section>

      <section className={styles['setting-group']}>
        <div>
          <h3>
            {dict('PC.Pages.TeamSetting.SpaceSettingTab.developerFeatures')}
            <TooltipIcon
              icon={<InfoCircleOutlined />}
              title={dict(
                'PC.Pages.TeamSetting.SpaceSettingTab.developerFeaturesTooltip',
              )}
            />
          </h3>
          <p>
            {dict(
              'PC.Pages.TeamSetting.SpaceSettingTab.developerFeaturesTooltip',
            )}
          </p>
        </div>
        <Switch
          className={styles['setting-switch']}
          checked={spaceDetailInfo?.allowDevelop === AllowDevelopEnum.Allow}
          onChange={(checked) => onChange('allowDevelop', checked)}
        />
      </section>

      <section className={styles['setting-group']}>
        <div>
          <h3>
            {dict(
              'PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublish',
            )}
            <TooltipIcon
              icon={<InfoCircleOutlined />}
              title={dict(
                'PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublishTooltip',
              )}
            />
          </h3>
          <p>
            {dict(
              'PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublishTooltip',
            )}
          </p>
        </div>
        <Switch
          className={styles['setting-switch']}
          checked={
            spaceDetailInfo?.receivePublish === ReceivePublishEnum.Receive
          }
          onChange={(checked) => onChange('receivePublish', checked)}
        />
      </section>

      <section className={styles['setting-group']}>
        <div>
          <h3>{dict('PC.Pages.TeamSetting.SpaceSettingTab.deleteSpace')}</h3>
          <p>
            {dict(
              'PC.Pages.TeamSetting.SpaceSettingTab.deleteSpaceDescription',
            )}
          </p>
        </div>
        <Button
          danger
          className={styles['danger-action-button']}
          onClick={() => setOpenRemoveModal(true)}
        >
          {dict('PC.Pages.TeamSetting.SpaceSettingTab.deleteSpaceBtn')}
        </Button>
      </section>

      <RemoveSpace
        spaceId={spaceId}
        name={spaceDetailInfo?.name}
        open={openRemoveModal}
        onCancel={() => setOpenRemoveModal(false)}
        onConfirmRemove={handlerConfirmRemove}
      />
      <TransferSpace
        spaceId={spaceId}
        open={openTransferModal}
        onCancel={() => setOpenTransferModal(false)}
        onConfirmTransfer={handlerConfirmTransfer}
      />
    </div>
  );
};

export default SpaceSettingTab;
