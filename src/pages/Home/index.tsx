import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  readAgentModeCache,
  writeAgentModeCache,
} from '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer';
import ChatInputHome, {
  type ChatInputHomeRef,
} from '@/components/ChatInputHome';
import Loading from '@/components/custom/Loading';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import {
  buildNewxNavigation,
  resolveNewxNavigationPath,
} from '@/layouts/DynamicMenusLayout/navigation';
import {
  apiCollectAgent,
  apiHomeCategoryList,
  apiPublishedAgentInfo,
  apiUnCollectAgent,
} from '@/services/agentDev';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { dict } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { RoleEnum } from '@/types/enums/common';
import { AgentTypeEnum, AllowDevelopEnum } from '@/types/enums/space';
import type {
  AgentDetailDto,
  AgentManualComponentInfo,
} from '@/types/interfaces/agent';
import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import {
  DisplayRecommendFunctionTypeEnum,
  type DisplayRecommendInfo,
} from '@/types/interfaces/displayRecommend';
import { App, message as antdMessage } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useModel, useRequest } from 'umi';
import { createProjectAndNavigate } from '../SpaceCreateProject/utils/projectCreateStrategy';
import ChatBoxRecommendNav from './components/ChatBoxRecommendNav';
import RecentWork from './components/RecentWork';
import DraggableHomeContent from './DraggableHomeContent';
import styles from './index.less';

const cx = classNames.bind(styles);
const EMPTY_MANUAL_COMPONENTS: AgentManualComponentInfo[] = [];

const PROJECT_FUNCTION_TYPE_MAP: Partial<
  Record<DisplayRecommendFunctionTypeEnum | string, AgentComponentTypeEnum>
> = {
  [DisplayRecommendFunctionTypeEnum.AgentDev]: AgentComponentTypeEnum.Agent,
  [DisplayRecommendFunctionTypeEnum.PageAppDev]: AgentComponentTypeEnum.PageApp,
  [DisplayRecommendFunctionTypeEnum.SkillDev]: AgentComponentTypeEnum.Skill,
  [DisplayRecommendFunctionTypeEnum.PluginDev]: AgentComponentTypeEnum.Plugin,
};

const TASK_AGENT_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
]);

const SPACE_SELECTOR_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.PageAppDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
]);

const Home: React.FC = () => {
  const { message } = App.useApp();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { getSpaceId, currentSpaceInfo } = useModel('spaceModel');
  const { menuTree } = useModel('menuModel');
  const navigationEntries = buildNewxNavigation(menuTree, {
    isOrdinaryMember: currentSpaceInfo?.currentUserRole === RoleEnum.User,
    allowDevelop: currentSpaceInfo?.allowDevelop !== AllowDevelopEnum.Not_Allow,
  }).flatMap((group) => group.entries);
  const expertMenu = navigationEntries.find(
    (entry) =>
      entry.resource === 'expert' &&
      /\/develop(?:\?|$)/.test(entry.menu.path || ''),
  );
  const expertPath =
    expertMenu &&
    resolveNewxNavigationPath(expertMenu.menu.path || '', getSpaceId());
  const discoverExpertMenu = navigationEntries.find(
    (entry) =>
      entry.resource === 'expert' &&
      entry.catalogScope === 'discover' &&
      new URL(entry.menu.path || '', 'http://newx.local').searchParams.get(
        'cate_type',
      ) === 'Agent',
  );
  const expertMarketplacePath = discoverExpertMenu
    ? resolveNewxNavigationPath(
        discoverExpertMenu.menu.path || '',
        getSpaceId(),
      )
    : null;
  const { setContext } = useModel('pageHandoffContext');
  const { handleCreateConversation } = useConversation();
  const chatInputRef = useRef<ChatInputHomeRef>(null);
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();
  const [isTaskAgentMode, setIsTaskAgentMode] = useState<boolean>(false);
  const [summonedExpert, setSummonedExpert] =
    useState<Pick<CategoryItemInfo, 'targetId' | 'name' | 'agentType'>>();
  const [selectedComputerId, setSelectedComputerId] = useState<string>('-1');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<number>();
  const [agentMode, setAgentMode] = useState<AgentMode>('yolo');
  const [activeTab, setActiveTab] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendNavList, setRecommendNavList] = useState<
    DisplayRecommendInfo[]
  >([]);
  const [selectedRecommend, setSelectedRecommend] =
    useState<DisplayRecommendInfo>();
  const [homeCategoryInfo, setHomeCategoryInfo] =
    useState<HomeAgentCategoryInfo>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const defaultAgentId =
    isTaskAgentMode && tenantConfigInfo?.defaultTaskAgentId
      ? tenantConfigInfo.defaultTaskAgentId
      : tenantConfigInfo?.defaultAgentId;
  const currentAgentId =
    selectedRecommend?.targetId || summonedExpert?.targetId || defaultAgentId;

  const handleAgentModeChange = useCallback(
    (mode: AgentMode) => {
      setAgentMode(mode);
      if (currentAgentId) {
        writeAgentModeCache(mode, currentAgentId);
      }
    },
    [currentAgentId],
  );
  const selectedFunctionType = selectedRecommend?.functionType || '';
  const selectedProjectType = useMemo(
    () => PROJECT_FUNCTION_TYPE_MAP[selectedFunctionType],
    [selectedFunctionType],
  );
  const effectiveTaskAgentActive = selectedRecommend
    ? TASK_AGENT_FUNCTION_TYPES.has(selectedFunctionType)
    : summonedExpert
    ? summonedExpert.agentType === AgentTypeEnum.TaskAgent
    : isTaskAgentMode;
  const workbenchExperts = useMemo(() => {
    const seen = new Set<number>();
    return Object.values(homeCategoryInfo?.categoryItems || {})
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
  }, [homeCategoryInfo]);
  const showSpaceSelector = selectedRecommend
    ? SPACE_SELECTOR_FUNCTION_TYPES.has(selectedFunctionType)
    : false;

  const runCategoryList = useCallback(async () => {
    try {
      const result = await apiHomeCategoryList({ skipErrorHandler: true });
      if (result?.success === false) {
        antdMessage.warning(result.message);
        setLoading(false);
        return;
      }

      const { data } = result;
      setHomeCategoryInfo(data);
      setActiveTab((previousTab) =>
        data?.categories?.some((category) => category.type === previousTab)
          ? previousTab
          : data?.categories?.[0]?.type,
      );
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  const runRecommendNavList = useCallback(async () => {
    try {
      const result = await apiDisplayRecommendList({ skipErrorHandler: true });
      if (result?.success === false) {
        setRecommendNavList([]);
        return;
      }

      const list = result?.data?.recChatBoxNav?.Agent || [];
      setRecommendNavList(
        [...list].sort((prev, next) => (prev.sort || 0) - (next.sort || 0)),
      );
    } catch {
      setRecommendNavList([]);
    }
  }, []);

  const { run: runCollectAgent } = useRequest(apiCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      runCategoryList();
    },
  });

  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      runCategoryList();
    },
  });

  useEffect(() => {
    setLoading(true);
    runCategoryList();
    runRecommendNavList();
  }, [runCategoryList, runRecommendNavList]);

  useEffect(() => {
    let cancelled = false;
    setAgentDetail(undefined);
    setSelectedComponentList([]);
    chatInputRef.current?.clear();
    if (currentAgentId) {
      apiPublishedAgentInfo(currentAgentId)
        .then(({ data }) => {
          if (!cancelled) setAgentDetail(data);
        })
        .catch(() => {
          if (!cancelled) setAgentDetail(undefined);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [currentAgentId, setSelectedComponentList]);

  useEffect(() => {
    if (agentDetail) {
      if (agentDetail.allowChooseMode !== DefaultSelectedEnum.Yes) {
        setAgentMode('yolo');
      } else {
        const cached = readAgentModeCache(currentAgentId);
        setAgentMode(cached || 'yolo');
      }
    }
  }, [agentDetail, currentAgentId]);

  useEffect(() => {
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  useEffect(() => {
    setSelectedComputerId(selectedRecommend ? '' : '-1');
    setSelectedModelId(undefined);
    setSelectedSpaceId(undefined);
  }, [selectedRecommend, currentAgentId]);

  const handleEnter = async (
    inputMessage: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    agentMode?: AgentMode,
  ) => {
    if (submitting) return;

    if (!tenantConfigInfo || !currentAgentId) {
      message.warning(dict('PC.Pages.Home.noTenantInfo'));
      return;
    }

    setSubmitting(true);
    try {
      if (selectedProjectType) {
        const spaceId = showSpaceSelector
          ? selectedSpaceId
          : Number(getSpaceId());
        if (!spaceId) {
          message.warning(dict('PC.Pages.Home.noTenantInfo'));
          return;
        }

        await createProjectAndNavigate({
          payload: {
            type: selectedProjectType,
            prompt: inputMessage,
            files,
            skillIds,
            modelId: modelId || selectedModelId,
            tools: selectedComponentList,
            computerId: selectedComputerId,
            agentMode,
            agentId: currentAgentId,
          },
          spaceId,
          tenantConfigInfo,
          setContext,
        });
        return;
      }

      await handleCreateConversation(currentAgentId, {
        message: inputMessage,
        files,
        infos: selectedComponentList,
        messageSourceType: 'home' as MessageSourceType,
        selectedComputerId,
        skillIds,
        modelId: modelId || selectedModelId,
        agentMode,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canUseWorkbenchAgentMode = !!(
    tenantConfigInfo?.defaultTaskAgentId &&
    tenantConfigInfo.defaultTaskAgentId > 0
  );
  const showTaskAgentToggle = !selectedRecommend && canUseWorkbenchAgentMode;

  const handleTabClick = (type: string) => {
    setActiveTab(type);
  };

  const handleToggleCollect = (_type: string, info: CategoryItemInfo) => {
    if (info.collect) {
      runUnCollectAgent(info.targetId);
    } else {
      runCollectAgent(info.targetId);
    }
  };

  const handleAgentClick = (agentInfo: CategoryItemInfo) => {
    const { targetId, lastConversationId } = agentInfo;

    if (lastConversationId) {
      history.push(`/home/chat/${lastConversationId}/${targetId}`);
      return;
    }

    history.push(`/agent/${targetId}`);
  };

  const handleRecommendSelect = (item: DisplayRecommendInfo) => {
    setSummonedExpert(undefined);
    setSelectedRecommend((prev) => (prev?.id === item.id ? undefined : item));
    // 延迟以确保重新渲染后聚焦
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 0);
  };

  return (
    <div
      id="home-container"
      className={cx(styles.container, 'flex', 'flex-col', 'items-center')}
    >
      <div className={styles.stage}>
        <main className={cx(styles.inputSection)}>
          <div className={cx(styles.titleContainer)}>
            {tenantConfigInfo?.homeSlogan ? (
              <h1
                className={cx(styles.title)}
                dangerouslySetInnerHTML={{
                  __html: tenantConfigInfo.homeSlogan,
                }}
              />
            ) : (
              <h1 className={cx(styles.title)}>
                {dict('PC.Pages.Home.welcome')}
              </h1>
            )}
          </div>
          <ChatBoxRecommendNav
            items={recommendNavList}
            selectedId={selectedRecommend?.id}
            onSelect={handleRecommendSelect}
          />
          <ChatInputHome
            ref={chatInputRef}
            showResourceMention
            enableManualResourceMention={
              selectedProjectType !== AgentComponentTypeEnum.PageApp
            }
            className={cx(styles.textarea)}
            onEnter={handleEnter}
            isClearInput={false}
            wholeDisabled={submitting}
            placeholder={selectedRecommend?.placeholder || undefined}
            manualComponents={
              agentDetail?.manualComponents || EMPTY_MANUAL_COMPONENTS
            }
            selectedComponentList={selectedComponentList}
            onSelectComponent={handleSelectComponent}
            showTaskAgentToggle={showTaskAgentToggle}
            isTaskAgentActive={effectiveTaskAgentActive}
            onToggleTaskAgent={() => {
              setIsTaskAgentMode(!effectiveTaskAgentActive);
              setSelectedRecommend(undefined);
              setSummonedExpert(undefined);
            }}
            workbenchModeEnabled
            canUseWorkbenchAgentMode={canUseWorkbenchAgentMode}
            workbenchExperts={workbenchExperts}
            selectedWorkbenchExpertId={summonedExpert?.targetId}
            onWorkbenchModeSelect={(mode) => {
              setIsTaskAgentMode(mode === 'agent');
              setSelectedRecommend(undefined);
              setSummonedExpert(undefined);
            }}
            onWorkbenchExpertSelect={(expert) => {
              setSelectedRecommend(undefined);
              setSummonedExpert(expert);
              chatInputRef.current?.focus();
            }}
            selectedComputerId={selectedComputerId}
            onComputerSelect={setSelectedComputerId}
            agentId={agentDetail?.agentId}
            agentSandboxId={agentDetail?.sandboxId}
            readonly={
              agentDetail?.allowPrivateSandbox === DefaultSelectedEnum.No
            }
            enableMention={
              agentDetail?.type === AgentTypeEnum.TaskAgent &&
              agentDetail?.allowAtSkill === DefaultSelectedEnum.Yes
            }
            allowOtherModel={agentDetail?.allowOtherModel}
            selectedModelId={selectedModelId}
            onModelSelect={setSelectedModelId}
            showSpaceSelector={showSpaceSelector}
            selectedSpaceId={selectedSpaceId}
            onSpaceSelect={setSelectedSpaceId}
            agentType={agentDetail?.type}
            selectedTag={
              selectedRecommend
                ? { label: selectedRecommend.label }
                : summonedExpert
                ? { label: summonedExpert.name }
                : undefined
            }
            onClearSelectedTag={() => {
              setSelectedRecommend(undefined);
              setSummonedExpert(undefined);
              chatInputRef.current?.clear();
              chatInputRef.current?.focus();
            }}
            agentMode={agentMode}
            onAgentModeChange={handleAgentModeChange}
            showAgentModeSelector={
              agentDetail?.allowChooseMode === DefaultSelectedEnum.Yes
            }
          />
        </main>
        <section className={cx(styles.recommendSection)}>
          <div className={cx(styles.wrapper)}>
            {loading ? (
              <Loading className={cx('h-full')} />
            ) : (
              homeCategoryInfo && (
                <DraggableHomeContent
                  expertMarketplacePath={expertMarketplacePath}
                  homeCategoryInfo={homeCategoryInfo}
                  activeTab={activeTab}
                  onTabClick={handleTabClick}
                  onAgentClick={handleAgentClick}
                  onToggleCollect={handleToggleCollect}
                  onDataUpdate={runCategoryList}
                />
              )
            )}
          </div>
        </section>
        <RecentWork
          canEdit={!!expertPath && /\/develop(?:\?|$)/.test(expertPath)}
        />
      </div>
    </div>
  );
};

export default Home;
