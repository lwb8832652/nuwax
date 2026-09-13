import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  ApiOutlined,
  CodeOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface TabItem {
  key: string;
  label: string;
  placeholder: string;
}

interface TabsListProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

const tabIcons: Record<string, React.ReactNode> = {
  [AgentComponentTypeEnum.Agent]: <RobotOutlined />,
  [AgentComponentTypeEnum.PageApp]: <CodeOutlined />,
  [AgentComponentTypeEnum.Skill]: <ThunderboltOutlined />,
  [AgentComponentTypeEnum.Plugin]: <ApiOutlined />,
};

const TabsList: React.FC<TabsListProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className={cx(styles['tabs-list'])}>
      {tabs.map((tab) => (
        <button
          type="button"
          aria-pressed={activeTab === tab.key}
          key={tab.key}
          className={cx(styles['tab-item'], {
            [styles['tab-active']]: activeTab === tab.key,
          })}
          onClick={() => {
            onChange(tab.key);
          }}
        >
          {tabIcons[tab.key]}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabsList;
