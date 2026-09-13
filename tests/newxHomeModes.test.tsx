import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { CategoryItemInfo } from '@/types/interfaces/agentConfig';
import { DisplayRecommendFunctionTypeEnum } from '@/types/interfaces/displayRecommend';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  inputProps: {} as any,
  sceneProps: {} as any,
  contentProps: {} as any,
  menuTree: [] as any[],
  homeCategoryInfo: {} as any,
  detail: vi.fn(),
  createConversation: vi.fn(),
  clearInput: vi.fn(),
  readAgentModeCache: vi.fn(),
  writeAgentModeCache: vi.fn(),
  tenant: { defaultAgentId: 10, defaultTaskAgentId: 20 },
}));

vi.mock('umi', () => ({
  history: { push: vi.fn() },
  useRequest: () => ({ run: vi.fn() }),
  useModel: (name: string) => {
    if (name === 'tenantConfigInfo') return { tenantConfigInfo: mocks.tenant };
    if (name === 'spaceModel') return { getSpaceId: () => 1 };
    if (name === 'menuModel') return { menuTree: mocks.menuTree };
    return { setContext: vi.fn() };
  },
}));
vi.mock('antd', () => ({
  App: { useApp: () => ({ message: { warning: vi.fn() } }) },
  message: { warning: vi.fn() },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/agentDev', () => ({
  apiPublishedAgentInfo: (...args: unknown[]) => mocks.detail(...args),
  apiHomeCategoryList: async () => ({ data: mocks.homeCategoryInfo }),
  apiCollectAgent: vi.fn(),
  apiUnCollectAgent: vi.fn(),
}));
vi.mock('@/services/displayRecommend', () => ({
  apiDisplayRecommendList: async () => ({
    data: { recChatBoxNav: { Agent: [] } },
  }),
}));
vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation: mocks.createConversation }),
}));
vi.mock(
  '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer',
  () => ({
    readAgentModeCache: (...args: unknown[]) =>
      mocks.readAgentModeCache(...args),
    writeAgentModeCache: (...args: unknown[]) =>
      mocks.writeAgentModeCache(...args),
  }),
);
vi.mock('@/pages/SpaceCreateProject/utils/projectCreateStrategy', () => ({
  createProjectAndNavigate: vi.fn(),
}));
vi.mock('@/components/ChatInputHome', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref) => {
      mocks.inputProps = props;
      React.useImperativeHandle(ref, () => ({
        clear: mocks.clearInput,
        focus: vi.fn(),
      }));
      return null;
    }),
  };
});
vi.mock('@/pages/Home/components/ChatBoxRecommendNav', () => ({
  default: (props: any) => {
    mocks.sceneProps = props;
    return null;
  },
}));
vi.mock('@/pages/Home/components/RecentWork', () => ({ default: () => null }));
vi.mock('@/pages/Home/DraggableHomeContent', () => ({
  default: (props: any) => {
    mocks.contentProps = props;
    return null;
  },
}));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/pages/Home/index.less', () => ({ default: {} }));

import Home from '@/pages/Home';

const expert = (
  targetId: number,
  name: string,
  agentType: CategoryItemInfo['agentType'],
  targetType = AgentComponentTypeEnum.Agent,
) =>
  ({
    targetId,
    name,
    agentType,
    targetType,
  } as CategoryItemInfo);

const chatbot = expert(42, 'Review specialist', AgentTypeEnum.ChatBot);
const taskAgent = expert(44, 'Build specialist', AgentTypeEnum.TaskAgent);

const send = async (message: string) => {
  await act(async () => {
    await mocks.inputProps.onEnter(
      message,
      [],
      [],
      undefined,
      mocks.inputProps.agentMode,
    );
  });
};

describe('NewX workbench Ask, Agent and summon expert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tenant.defaultTaskAgentId = 20;
    mocks.menuTree = [];
    mocks.homeCategoryInfo = {
      categories: [{ name: 'Favorites', type: 'favorites' }],
      categoryItems: {
        favorites: [
          chatbot,
          expert(54, 'Web application', AgentTypeEnum.PageApp),
          expert(
            70,
            'A skill',
            AgentTypeEnum.ChatBot,
            AgentComponentTypeEnum.Skill,
          ),
        ],
        recommended: [
          expert(42, 'Review specialist', AgentTypeEnum.ChatBot),
          taskAgent,
        ],
      },
    };
    mocks.detail.mockImplementation(async (agentId: number) => ({
      data: {
        agentId,
        manualComponents: [],
        type:
          agentId === 20 || agentId === 44
            ? AgentTypeEnum.TaskAgent
            : AgentTypeEnum.ChatBot,
        allowAtSkill: DefaultSelectedEnum.No,
        allowChooseMode: DefaultSelectedEnum.Yes,
      },
    }));
  });
  afterEach(cleanup);

  it('offers each conversational expert once and excludes apps and non-agent resources', async () => {
    render(<Home />);
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));

    expect(mocks.inputProps.workbenchModeEnabled).toBe(true);
    expect(mocks.inputProps.showTaskAgentToggle).toBe(true);
    expect(mocks.inputProps.isTaskAgentActive).toBe(false);
    expect(
      mocks.inputProps.workbenchExperts.map(
        (item: CategoryItemInfo) => item.targetId,
      ),
    ).toEqual([42, 44]);
    expect(mocks.inputProps.selectedWorkbenchExpertId).toBeUndefined();
  });

  it('links discovery to the authorized global expert catalog instead of the space catalog', async () => {
    const menu = (
      id: number,
      code: string,
      path: string,
      children: any[] = [],
    ) => ({
      id,
      code,
      name: code,
      path,
      children,
      status: 1,
      menuBindType: 0,
    });
    mocks.menuTree = [
      menu(1, 'workspace', '/space', [
        menu(2, 'space_square', '/space/:spaceId/space-square'),
      ]),
      menu(3, 'system_square', '/square'),
    ];
    render(<Home />);

    await waitFor(() =>
      expect(mocks.contentProps.expertMarketplacePath).toBe(
        '/square?cate_type=Agent',
      ),
    );
  });

  it('routes explicit Ask and Agent choices to their original default agent IDs', async () => {
    render(<Home />);
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));

    await send('ordinary question');
    expect(mocks.createConversation).toHaveBeenLastCalledWith(
      10,
      expect.objectContaining({
        message: 'ordinary question',
        messageSourceType: 'home',
      }),
    );

    act(() => mocks.inputProps.onWorkbenchModeSelect('agent'));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    expect(mocks.inputProps.isTaskAgentActive).toBe(true);
    await send('automate this');
    expect(mocks.createConversation).toHaveBeenLastCalledWith(
      20,
      expect.objectContaining({ message: 'automate this' }),
    );

    act(() => mocks.inputProps.onWorkbenchModeSelect('ask'));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));
    expect(mocks.inputProps.isTaskAgentActive).toBe(false);
  });

  it('sends with a summoned expert and keeps execution approval separate from Ask/Agent', async () => {
    render(<Home />);
    await waitFor(() =>
      expect(mocks.inputProps.workbenchExperts).toHaveLength(2),
    );

    act(() => mocks.inputProps.onWorkbenchExpertSelect(chatbot));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(42));
    expect(mocks.inputProps.selectedWorkbenchExpertId).toBe(42);
    expect(mocks.inputProps.selectedTag).toEqual({
      label: 'Review specialist',
    });
    expect(mocks.inputProps.isTaskAgentActive).toBe(false);

    act(() => mocks.inputProps.onAgentModeChange('ask'));
    expect(mocks.inputProps.isTaskAgentActive).toBe(false);
    await send('please review');
    expect(mocks.createConversation).toHaveBeenLastCalledWith(
      42,
      expect.objectContaining({
        message: 'please review',
        agentMode: 'ask',
      }),
    );
    expect(mocks.writeAgentModeCache).toHaveBeenCalledWith('ask', 42);

    act(() => mocks.inputProps.onWorkbenchExpertSelect(taskAgent));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(44));
    expect(mocks.inputProps.selectedWorkbenchExpertId).toBe(44);
    expect(mocks.inputProps.selectedTag).toEqual({ label: 'Build specialist' });
    expect(mocks.inputProps.isTaskAgentActive).toBe(true);
    await send('build this');
    expect(mocks.createConversation).toHaveBeenLastCalledWith(
      44,
      expect.objectContaining({ message: 'build this' }),
    );

    act(() => mocks.inputProps.onClearSelectedTag());
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));
    expect(mocks.inputProps.selectedWorkbenchExpertId).toBeUndefined();
    expect(mocks.inputProps.selectedTag).toBeUndefined();
  });

  it('restores the chosen base mode when a summoned expert is cleared', async () => {
    render(<Home />);
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));

    act(() => mocks.inputProps.onWorkbenchModeSelect('agent'));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    act(() => mocks.inputProps.onWorkbenchExpertSelect(chatbot));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(42));
    expect(mocks.inputProps.isTaskAgentActive).toBe(false);

    act(() => mocks.inputProps.onClearSelectedTag());
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    expect(mocks.inputProps.isTaskAgentActive).toBe(true);
  });

  it('does not leave Agent selected without a configured default task agent', async () => {
    mocks.tenant.defaultTaskAgentId = 0;
    render(<Home />);
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));
    expect(mocks.inputProps.canUseWorkbenchAgentMode).toBe(false);

    act(() => mocks.inputProps.onWorkbenchExpertSelect(taskAgent));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(44));
    expect(mocks.inputProps.isTaskAgentActive).toBe(true);
    act(() => mocks.inputProps.onClearSelectedTag());
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));
    expect(mocks.inputProps.isTaskAgentActive).toBe(false);
  });

  it('choosing the current mode clears a summoned expert or quick scene', async () => {
    render(<Home />);
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));

    act(() => mocks.inputProps.onWorkbenchExpertSelect(chatbot));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(42));
    act(() => mocks.inputProps.onWorkbenchModeSelect('ask'));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));
    expect(mocks.inputProps.selectedWorkbenchExpertId).toBeUndefined();

    act(() =>
      mocks.sceneProps.onSelect({
        id: 99,
        targetId: 55,
        label: 'Quick scene',
        functionType: DisplayRecommendFunctionTypeEnum.Chat,
      }),
    );
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(55));
    expect(mocks.inputProps.selectedTag).toEqual({ label: 'Quick scene' });

    act(() => mocks.inputProps.onWorkbenchModeSelect('agent'));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    expect(mocks.inputProps.selectedTag).toBeUndefined();
    await send('default task');
    expect(mocks.createConversation).toHaveBeenLastCalledWith(
      20,
      expect.objectContaining({ message: 'default task' }),
    );
  });
});
