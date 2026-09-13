import { DefaultSelectedEnum } from '@/types/enums/agent';
import {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import { useState } from 'react';

// 会话输入框已选择组件
const useSelectedComponent = () => {
  // 已选中的组件列表
  const [selectedComponentList, setSelectedComponentList] = useState<
    AgentSelectedComponentInfo[]
  >([]);

  // 选中配置组件
  const handleSelectComponent = (item: AgentSelectedComponentInfo) => {
    setSelectedComponentList((current) => {
      const isSameComponent = (component: AgentSelectedComponentInfo) =>
        component.id === item.id && component.type === item.type;

      return current.some(isSameComponent)
        ? current.filter((component) => !isSameComponent(component))
        : [...current, { id: item.id, type: item.type }];
    });
  };

  // 初始化选中的组件列表
  const initSelectedComponentList = (
    manualComponents?: AgentManualComponentInfo[],
  ) => {
    // 初始化选中的组件列表
    if (manualComponents?.length) {
      // 手动组件默认选中的组件
      const _manualComponents = manualComponents
        .filter((item) => item.defaultSelected === DefaultSelectedEnum.Yes)
        .map((item) => ({
          id: item.id,
          type: item.type,
        }));
      setSelectedComponentList(_manualComponents || []);
    }
  };

  return {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  };
};

export default useSelectedComponent;
