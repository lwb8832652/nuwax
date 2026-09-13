import useConversation from '@/hooks/useConversation';
import { apiHomeCategoryList } from '@/services/agentDev';
import { t } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { CategoryItemInfo } from '@/types/interfaces/agentConfig';
import { Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

type WorkbenchExpert = Pick<
  CategoryItemInfo,
  'targetId' | 'name' | 'agentType'
>;

interface ChatWorkbenchComposerOptions {
  enabled: boolean;
  conversationId: number;
  agentId: number;
  agentName?: string;
  agentType?: string;
  hasPermission?: boolean;
  defaultAgentId?: number;
  defaultTaskAgentId?: number;
  busy: boolean;
}

/** 会话绑定的专家不可原地替换，工作模式切换继续使用原有的新建会话入口。 */
export const useChatWorkbenchComposer = ({
  enabled,
  conversationId,
  agentId,
  agentName,
  agentType,
  hasPermission,
  defaultAgentId,
  defaultTaskAgentId,
  busy,
}: ChatWorkbenchComposerOptions) => {
  const { handleCreateConversation } = useConversation();
  const [experts, setExperts] = useState<WorkbenchExpert[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [switching, setSwitching] = useState(false);
  const switchingRef = useRef(false);
  const requestContextRef = useRef({
    enabled,
    conversationId,
    agentId,
    busy,
    hasPermission,
  });
  requestContextRef.current = {
    enabled,
    conversationId,
    agentId,
    busy: busy || hasDraft,
    hasPermission,
  };

  useEffect(() => {
    return () => {
      requestContextRef.current.enabled = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    apiHomeCategoryList({ skipErrorHandler: true })
      .then((result) => {
        if (cancelled || result?.success === false) return;
        const seen = new Set<number>();
        const availableExperts = Object.values(
          result?.data?.categoryItems || {},
        )
          .flat()
          .filter((item) => {
            if (
              item.targetType !== AgentComponentTypeEnum.Agent ||
              item.agentType === AgentTypeEnum.PageApp ||
              seen.has(item.targetId)
            ) {
              return false;
            }
            seen.add(item.targetId);
            return true;
          });
        setExperts(availableExperts);
      })
      .catch(() => {
        if (!cancelled) setExperts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const requestAgentSwitch = useCallback(
    (targetAgentId: number | undefined, label: string) => {
      const current = requestContextRef.current;
      if (
        !current.enabled ||
        current.busy ||
        current.hasPermission === false ||
        switchingRef.current ||
        !targetAgentId ||
        targetAgentId <= 0 ||
        targetAgentId === current.agentId
      ) {
        return;
      }

      const sourceConversationId = current.conversationId;
      switchingRef.current = true;
      setSwitching(true);
      const releaseSwitch = () => {
        switchingRef.current = false;
        setSwitching(false);
      };
      Modal.confirm({
        title: t('PC.Pages.Chat.newConversation'),
        content: t('PC.Pages.Chat.switchExpertConfirmation', label),
        okText: t('PC.Common.Global.confirm'),
        cancelText: t('PC.Common.Global.cancel'),
        onCancel: releaseSwitch,
        onOk: async () => {
          const latest = requestContextRef.current;
          try {
            // 确认期间切换了页面或会话开始执行时，不再创建目标会话。
            if (
              !latest.enabled ||
              latest.busy ||
              latest.hasPermission === false ||
              latest.conversationId !== sourceConversationId
            ) {
              return;
            }
            await handleCreateConversation(targetAgentId);
          } finally {
            releaseSwitch();
          }
        },
      });
    },
    [handleCreateConversation],
  );

  const canUseWorkbenchAgentMode = !!(
    defaultTaskAgentId && defaultTaskAgentId > 0
  );
  const isTaskAgentActive = agentType === AgentTypeEnum.TaskAgent;
  const isSelectedExpert =
    agentId !== defaultAgentId && agentId !== defaultTaskAgentId;
  return {
    workbenchModeEnabled: enabled,
    workbenchModeDisabled:
      busy || hasDraft || switching || hasPermission === false,
    workbenchModeDisabledReason: hasDraft
      ? t('PC.Pages.Chat.switchModeDraftHint')
      : busy
      ? t('PC.Pages.Chat.switchModeBusyHint')
      : switching
      ? t('PC.Pages.Chat.switchModePendingHint')
      : hasPermission === false
      ? t('PC.Components.ChatInputHome.noAgentPermission')
      : undefined,
    onDraftStateChange: setHasDraft,
    canUseWorkbenchAgentMode,
    isTaskAgentActive,
    workbenchExperts: experts,
    selectedWorkbenchExpertId: isSelectedExpert ? agentId : undefined,
    selectedTag:
      isSelectedExpert && agentName ? { label: agentName } : undefined,
    onWorkbenchModeSelect: (mode: 'ask' | 'agent') =>
      requestAgentSwitch(
        mode === 'agent' ? defaultTaskAgentId : defaultAgentId,
        mode === 'agent' ? 'Agent' : 'Ask',
      ),
    onWorkbenchExpertSelect: (expert: WorkbenchExpert) => {
      // 只接受当前用户的首页资源接口实际返回的专家。
      const availableExpert = experts.find(
        (item) => item.targetId === expert.targetId,
      );
      if (availableExpert) {
        requestAgentSwitch(availableExpert.targetId, availableExpert.name);
      }
    },
    onClearSelectedTag: () =>
      requestAgentSwitch(
        isTaskAgentActive ? defaultTaskAgentId : defaultAgentId,
        isTaskAgentActive ? 'Agent' : 'Ask',
      ),
  };
};
