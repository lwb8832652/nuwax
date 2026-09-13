import { SvgIcon } from '@/components/base';
import { RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

interface TabItemProps {
  active: boolean;
  icon: string;
  text: string;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isSecondMenuCollapsed?: boolean;
  hasChildren?: boolean;
}

const TabItem: React.FC<TabItemProps> = ({
  active,
  icon,
  onClick,
  text,
  onMouseEnter,
  onMouseLeave,
  isSecondMenuCollapsed = false,
  hasChildren = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onFocus={onMouseEnter}
    className={classNames(styles.item, {
      [styles.active]: active,
      [styles.collapsed]: isSecondMenuCollapsed,
    })}
    aria-label={text}
    aria-current={active ? 'page' : undefined}
    title={isSecondMenuCollapsed ? text : undefined}
  >
    <span className={styles.icon}>
      {icon && /\.(png|jpe?g|webp)(\?|$)/i.test(icon) ? (
        <img src={icon} alt="" />
      ) : (
        <SvgIcon name={icon || 'icons-nav-task-time'} />
      )}
    </span>
    {!isSecondMenuCollapsed && (
      <>
        <span className={styles.text}>{text}</span>
        {hasChildren && <RightOutlined className={styles.caret} />}
      </>
    )}
  </button>
);

export default TabItem;
