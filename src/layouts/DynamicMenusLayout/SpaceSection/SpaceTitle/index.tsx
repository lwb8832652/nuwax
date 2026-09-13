import { SvgIcon } from '@/components/base';
import { Popover, Typography } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CreateNewTeam from './CreateNewTeam';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

interface SpaceTitleProps {
  className?: string;
  name: string;
  collapsed?: boolean;
}

/**
 * Popover弹窗-空间主题
 */
const SpaceTitle: React.FC<SpaceTitleProps> = ({ name, collapsed = false }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const showModal = () => {
    setOpen(false);
    setOpenModal(true);
  };

  return (
    <>
      <Popover
        placement="bottomLeft"
        open={open}
        trigger="click"
        arrow={false}
        destroyOnHidden
        onOpenChange={setOpen}
        content={
          <PersonalSpaceContent
            onCreateTeam={showModal}
            onClosePopover={setOpen}
            currentSpaceName={name}
          />
        }
      >
        <button
          type="button"
          className={cx(styles.header, collapsed && styles.collapsed)}
          aria-label={name}
          aria-expanded={open}
          title={collapsed ? name : undefined}
        >
          <span className={styles['space-mark']} aria-hidden="true">
            {name.slice(0, 1)}
          </span>
          {!collapsed && (
            <>
              <Typography.Text className={styles.name} ellipsis>
                {name}
              </Typography.Text>
              <SvgIcon name="icons-common-caret_down" rotate={open ? 180 : 0} />
            </>
          )}
        </button>
      </Popover>
      {/*创建团队空间*/}
      <CreateNewTeam open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
};

export default SpaceTitle;
