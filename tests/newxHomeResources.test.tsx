import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { DisplayRecommendFunctionTypeEnum } from '@/types/interfaces/displayRecommend';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  inputProps: {} as any,
  sceneProps: {} as any,
  detail: vi.fn(),
  createConversation: vi.fn(),
  clear: vi.fn(),
  tenant: { defaultAgentId: 10, defaultTaskAgentId: 20 },
}));

vi.mock('umi', () => ({
  history: { push: vi.fn() },
  useRequest: () => ({ run: vi.fn() }),
  useModel: (name: string) => {
    if (name === 'tenantConfigInfo') return { tenantConfigInfo: mocks.tenant };
    if (name === 'spaceModel') return { getSpaceId: () => 1 };
    if (name === 'menuModel') return { menuTree: [] };
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
  apiHomeCategoryList: async () => ({
    data: { categories: [], categoryItems: {} },
  }),
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
    readAgentModeCache: () => undefined,
    writeAgentModeCache: vi.fn(),
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
        clear: mocks.clear,
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
vi.mock('@/pages/Home/DraggableHomeContent', () => ({ default: () => null }));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/pages/Home/index.less', () => ({ default: {} }));

import Home from '@/pages/Home';

const resource = {
  id: 71,
  type: AgentComponentTypeEnum.Knowledge,
  name: 'Project documents',
  icon: '',
  description: '',
  defaultSelected: DefaultSelectedEnum.Yes,
};
const detail = (agentId: number, manualComponents: any[] = []) => ({
  data: {
    agentId,
    manualComponents,
    type: AgentTypeEnum.ChatBot,
    allowAtSkill: DefaultSelectedEnum.No,
  },
});

describe('NewX workbench resource handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('shows the resource picker while retaining skill permissions and sends configured component IDs separately', async () => {
    mocks.detail.mockResolvedValue(detail(10, [resource]));
    render(<Home />);
    await waitFor(() =>
      expect(mocks.inputProps.selectedComponentList).toEqual([
        { id: 71, type: AgentComponentTypeEnum.Knowledge },
      ]),
    );
    expect(mocks.inputProps.showResourceMention).toBe(true);
    expect(mocks.inputProps.enableMention).toBe(false);
    await act(async () =>
      mocks.inputProps.onEnter('Use these resources', [], [22]),
    );
    expect(mocks.createConversation).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        infos: [{ id: 71, type: AgentComponentTypeEnum.Knowledge }],
        skillIds: [22],
      }),
    );
  });

  it('clears the previous expert resources when switching to a scene with no manual components', async () => {
    mocks.detail.mockImplementation(async (id: number) =>
      detail(id, id === 10 ? [resource] : []),
    );
    render(<Home />);
    await waitFor(() =>
      expect(mocks.inputProps.selectedComponentList).toHaveLength(1),
    );
    act(() => mocks.sceneProps.onSelect({ id: 2, targetId: 20 }));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    expect(mocks.inputProps.manualComponents).toEqual([]);
    expect(mocks.inputProps.selectedComponentList).toEqual([]);
  });

  it('ignores a previous expert response that resolves after the current scene', async () => {
    let resolvePrevious!: (value: ReturnType<typeof detail>) => void;
    mocks.detail.mockImplementation((id: number) =>
      id === 10
        ? new Promise((resolve) => {
            resolvePrevious = resolve;
          })
        : Promise.resolve(detail(20)),
    );
    render(<Home />);
    act(() => mocks.sceneProps.onSelect({ id: 2, targetId: 20 }));
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    await act(async () => resolvePrevious(detail(10, [resource])));
    expect(mocks.inputProps.agentId).toBe(20);
    expect(mocks.inputProps.manualComponents).toEqual([]);
  });

  it('keeps component IDs out of the web-app data-source picker', async () => {
    mocks.detail.mockImplementation(async (id: number) =>
      detail(id, [resource]),
    );
    render(<Home />);
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(10));
    act(() =>
      mocks.sceneProps.onSelect({
        id: 3,
        targetId: 20,
        functionType: DisplayRecommendFunctionTypeEnum.PageAppDev,
      }),
    );
    await waitFor(() => expect(mocks.inputProps.agentId).toBe(20));
    expect(mocks.inputProps.enableManualResourceMention).toBe(false);
    expect(mocks.inputProps.showResourceMention).toBe(true);
  });
});
