import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  categories: vi.fn(),
  createConversation: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@/services/agentDev', () => ({
  apiHomeCategoryList: (...args: unknown[]) => mocks.categories(...args),
}));
vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation: mocks.createConversation }),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  getCurrentLang: () => 'zh-cn',
}));
vi.mock('antd', () => ({
  Modal: { confirm: (...args: unknown[]) => mocks.confirm(...args) },
}));

import { useChatWorkbenchComposer } from '@/pages/Chat/hooks/useChatWorkbenchComposer';

const expert = {
  targetId: 42,
  targetType: AgentComponentTypeEnum.Agent,
  name: 'Review expert',
  agentType: AgentTypeEnum.ChatBot,
} as const;
const initialOptions = {
  enabled: true,
  conversationId: 1,
  agentId: 10,
  agentName: 'Ask assistant',
  agentType: AgentTypeEnum.ChatBot,
  hasPermission: true,
  defaultAgentId: 10,
  defaultTaskAgentId: 20,
  busy: false,
};

describe('chat workbench composer mode changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.categories.mockResolvedValue({
      data: {
        categoryItems: {
          favorites: [expert],
          recommended: [
            expert,
            { ...expert, targetId: 44, agentType: AgentTypeEnum.PageApp },
            {
              ...expert,
              targetId: 45,
              targetType: AgentComponentTypeEnum.Skill,
            },
          ],
        },
      },
    });
    mocks.createConversation.mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it('keeps the existing conversation until a different authorized expert is confirmed', async () => {
    const { result } = renderHook(() =>
      useChatWorkbenchComposer(initialOptions),
    );
    await waitFor(() =>
      expect(result.current.workbenchExperts).toEqual([expert]),
    );

    act(() => result.current.onWorkbenchModeSelect('ask'));
    act(() =>
      result.current.onWorkbenchExpertSelect({ ...expert, targetId: 999 }),
    );
    expect(mocks.confirm).not.toHaveBeenCalled();

    act(() => result.current.onWorkbenchExpertSelect(expert));
    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(mocks.createConversation).not.toHaveBeenCalled();
    expect(mocks.confirm.mock.calls[0][0].content).toBe(
      'PC.Pages.Chat.switchExpertConfirmation',
    );
    await act(async () => mocks.confirm.mock.calls[0][0].onOk());
    expect(mocks.createConversation).toHaveBeenCalledWith(42);
  });

  it('preserves drafts and blocks changes while the current session is busy', async () => {
    const { result, rerender } = renderHook(
      (options) => useChatWorkbenchComposer(options),
      { initialProps: initialOptions },
    );
    await waitFor(() =>
      expect(result.current.workbenchExperts).toHaveLength(1),
    );
    act(() => result.current.onDraftStateChange(true));
    expect(result.current.workbenchModeDisabled).toBe(true);
    act(() => result.current.onWorkbenchModeSelect('agent'));
    expect(mocks.confirm).not.toHaveBeenCalled();

    act(() => result.current.onDraftStateChange(false));
    rerender({ ...initialOptions, busy: true });
    act(() => result.current.onWorkbenchExpertSelect(expert));
    expect(mocks.confirm).not.toHaveBeenCalled();

    rerender(initialOptions);
    act(() => result.current.onWorkbenchModeSelect('agent'));
    rerender({ ...initialOptions, busy: true });
    await act(async () => mocks.confirm.mock.calls[0][0].onOk());
    expect(mocks.createConversation).not.toHaveBeenCalled();
  });

  it('leaves embedded sessions unchanged and disables unavailable default Agent mode', async () => {
    const { result, rerender } = renderHook(
      (options) => useChatWorkbenchComposer(options),
      { initialProps: { ...initialOptions, enabled: false } },
    );
    expect(result.current.workbenchModeEnabled).toBe(false);
    expect(mocks.categories).not.toHaveBeenCalled();
    act(() => result.current.onWorkbenchModeSelect('agent'));
    expect(mocks.confirm).not.toHaveBeenCalled();

    rerender({ ...initialOptions, defaultTaskAgentId: 0 });
    await waitFor(() =>
      expect(result.current.workbenchExperts).toHaveLength(1),
    );
    expect(result.current.canUseWorkbenchAgentMode).toBe(false);
    act(() => result.current.onWorkbenchModeSelect('agent'));
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('does not switch after the confirmation belongs to an old conversation', async () => {
    const { result, rerender } = renderHook(
      (options) => useChatWorkbenchComposer(options),
      { initialProps: initialOptions },
    );
    await waitFor(() =>
      expect(result.current.workbenchExperts).toHaveLength(1),
    );
    act(() => result.current.onWorkbenchModeSelect('agent'));
    rerender({ ...initialOptions, conversationId: 2 });
    await act(async () => mocks.confirm.mock.calls[0][0].onOk());
    expect(mocks.createConversation).not.toHaveBeenCalled();
  });
});
