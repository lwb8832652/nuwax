import type { ChatInputHomeRef } from '@/components/ChatInputHome';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { UploadFileStatus } from '@/types/enums/common';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  editor: {} as any,
  at: {} as any,
  selected: [] as any[],
  upload: {} as any,
  send: vi.fn(),
  globalSession: {} as any,
  useModel: vi.fn(),
  voice: {} as any,
  queueEnabled: false,
}));
vi.mock('umi', () => ({
  useModel: (name: string) => {
    mocks.useModel(name);
    return name === 'tenantConfigInfo'
      ? { tenantConfigInfo: { enableSubscription: 0 } }
      : {
          messageList: [],
          disabledConversationActive: vi.fn(),
          conversationInfo: {},
          ...mocks.globalSession,
        };
  },
}));
vi.mock('@/constants/feature.constants', () => ({
  get ENABLE_CHAT_MESSAGE_QUEUE() {
    return mocks.queueEnabled;
  },
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));
vi.mock('@/hooks/useSubscription', () => ({ default: () => ({}) }));
vi.mock('@/hooks/useExecutingTaskStatusPoll', () => ({
  isSessionStreamBusy: () => false,
}));
vi.mock('@/components/ChatInputHome/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/utils/eventBus', () => ({
  default: { on: vi.fn(), off: vi.fn() },
  EVENT_NAMES: { QUEUE_EDIT_MESSAGE: 'queue-edit' },
}));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatUploadFile', () => ({ default: () => null }));
vi.mock('@/components/PermissionMask', () => ({ default: () => null }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/ChatInputHome/ManualComponentItem', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/ModelSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/ComputerTypeSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/SpaceSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/AtMentionIcon', () => ({
  default: (props: any) => {
    mocks.at = props;
    return null;
  },
}));
vi.mock('@/components/ChatInputHome/MentionEditor', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any) => {
      mocks.editor = props;
      return null;
    }),
  };
});
vi.mock('@/components/business-component/VoiceInput', () => ({
  mergeVoiceTranscript: (previous: string, text: string) => previous + text,
  ChatInputVoiceFooter: {
    Provider: ({ children, ...props }: any) => {
      mocks.voice = props;
      return children(false);
    },
    HideWhenActive: ({ children }: any) => children,
    Expand: () => null,
    Right: ({ children, defaultActions }: any) => (
      <div>
        {children}
        {defaultActions}
      </div>
    ),
  },
}));
vi.mock('antd', () => ({
  message: { error: vi.fn() },
  Tooltip: ({ children }: any) => children,
  Upload: ({ children, ...props }: any) => {
    mocks.upload = props;
    return children;
  },
  Dropdown: ({ children }: any) => children,
}));

import ChatInputHome from '@/components/ChatInputHome';
import ChatInputHomeIndependent from '@/components/business-component/UnifiedChatSession/components/ChatInputHomeIndependent';
import eventBus from '@/utils/eventBus';

const component = {
  id: 71,
  type: AgentComponentTypeEnum.Knowledge,
  name: 'Documents',
  icon: '',
  description: '',
  defaultSelected: 0,
};
const mention = {
  targetId: 71,
  targetType: AgentComponentTypeEnum.Knowledge,
  source: 'manual',
  name: 'Documents',
};
function Harness({
  initiallySelected = false,
  composerRef,
}: {
  initiallySelected?: boolean;
  composerRef?: React.Ref<ChatInputHomeRef>;
}) {
  const [selected, setSelected] = useState(
    initiallySelected ? [{ id: 71, type: component.type }] : [],
  );
  mocks.selected = selected;
  return (
    <ChatInputHome
      ref={composerRef}
      showResourceMention
      enableMention={false}
      manualComponents={[component]}
      selectedComponentList={selected}
      onEnter={mocks.send}
      onSelectComponent={(item) =>
        setSelected((current) =>
          current.some(
            (existing) =>
              existing.id === item.id && existing.type === item.type,
          )
            ? current.filter(
                (existing) =>
                  existing.id !== item.id || existing.type !== item.type,
              )
            : [...current, item],
        )
      }
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.globalSession = {};
  mocks.queueEnabled = false;
});
afterEach(cleanup);
describe('NewX composer manual resource activation', () => {
  it('supports configured resources without enabling unauthorized skill queries', () => {
    render(<Harness />);
    expect(mocks.editor.enableMention).toBe(true);
    expect(mocks.editor.enableSkillMention).toBe(false);
    expect(mocks.editor.manualComponents).toEqual([component]);
  });

  it('activates a selected resource once and deactivates it on removing its mention', () => {
    render(<Harness />);
    act(() => mocks.editor.onMentionSelect(mention));
    expect(mocks.selected).toEqual([{ id: 71, type: component.type }]);
    act(() => mocks.editor.onMentionSelect(mention));
    expect(mocks.selected).toHaveLength(1);
    act(() => mocks.editor.onMentionRemove(mention));
    expect(mocks.selected).toEqual([]);
  });

  it('retains a resource that was already enabled before inserting its mention', () => {
    render(<Harness initiallySelected />);
    act(() => mocks.editor.onMentionSelect(mention));
    expect(mocks.selected).toHaveLength(1);
    act(() => mocks.editor.onMentionRemove(mention));
    expect(mocks.selected).toEqual([{ id: 71, type: component.type }]);
  });

  it('clears the previous expert draft and ignores late attachment updates', () => {
    const composerRef = createRef<ChatInputHomeRef>();
    const { container } = render(<Harness composerRef={composerRef} />);
    const uploadedFile = {
      uid: 'old-expert-attachment',
      name: 'old.pdf',
      size: 15,
      type: 'application/pdf',
      status: UploadFileStatus.done,
      response: {
        code: '0000',
        data: {
          key: 'old-expert-key',
          url: 'https://example.invalid/old.pdf',
        },
      },
    };

    act(() => mocks.upload.onChange({ fileList: [uploadedFile] }));
    act(() => mocks.editor.onChange('old expert draft'));
    act(() => composerRef.current?.clear());
    act(() => mocks.upload.onChange({ fileList: [uploadedFile] }));
    act(() => mocks.editor.onChange('new expert draft'));
    fireEvent.click(container.querySelector('[data-chat-footer] .send-box')!);

    expect(mocks.send).toHaveBeenCalled();
    expect(mocks.send.mock.calls[0][0]).toBe('new expert draft');
    expect(mocks.send.mock.calls[0][1]).toEqual([]);
  });
});

describe('shared composer session adapter', () => {
  it('uses the same resource composer without reading the main session state', () => {
    mocks.globalSession = {
      loadingConversation: true,
      isConversationActive: true,
    };
    const { container } = render(
      <ChatInputHomeIndependent
        onEnter={mocks.send}
        voiceInputMock
        enableMention={false}
        manualComponents={[component]}
        onSelectComponent={vi.fn()}
      />,
    );

    expect(mocks.useModel).not.toHaveBeenCalledWith('conversationInfo');
    expect(
      container.querySelector('[data-chat-composer].workbench-composer'),
    ).not.toBeNull();
    expect(mocks.editor.enableMention).toBe(true);
    expect(mocks.editor.enableSkillMention).toBe(false);
    expect(mocks.editor.manualComponents).toEqual([component]);
    expect(mocks.voice.mock).toBe(true);
    act(() => mocks.editor.onChange('Current session draft'));
    fireEvent.click(container.querySelector('[data-chat-footer] .send-box')!);
    expect(mocks.send).toHaveBeenCalledWith(
      'Current session draft',
      [],
      [],
      undefined,
      'yolo',
    );
  });

  it('blocks repeat sending while busy and pauses its own queue before stopping', () => {
    const calls: string[] = [];
    const stop = vi.fn(async (id: string) => {
      calls.push(`stop:${id}`);
    });
    const { container } = render(
      <ChatInputHomeIndependent
        onEnter={mocks.send}
        isConversationActive
        getCurrentConversationId={() => 44}
        getCurrentConversationRequestId={() => 'request-44'}
        runStopConversation={stop}
        onUserStopConversation={() => calls.push('pause')}
      />,
    );
    act(() => mocks.editor.onChange('Next question'));
    act(() => mocks.editor.onPressEnter());
    expect(mocks.send).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[data-chat-footer] .stop-box')!);
    expect(calls).toEqual(['pause', 'stop:44']);
  });

  it('stops a temporary session using only its own request id', () => {
    const temporaryStop = vi.fn();
    const pause = vi.fn();
    mocks.globalSession = {
      getCurrentConversationRequestId: () => 'main-request',
    };
    const { container } = render(
      <ChatInputHomeIndependent
        onEnter={mocks.send}
        isConversationActive
        getCurrentConversationRequestId={() => 'preview-request'}
        onTempChatStop={temporaryStop}
        onUserStopConversation={pause}
      />,
    );
    fireEvent.click(container.querySelector('[data-chat-footer] .stop-box')!);
    expect(temporaryStop).toHaveBeenCalledWith('preview-request');
    expect(pause).not.toHaveBeenCalled();
  });

  it('allows a busy session to enqueue drafts when message queuing is enabled', () => {
    mocks.queueEnabled = true;
    const { container } = render(
      <ChatInputHomeIndependent onEnter={mocks.send} isConversationActive />,
    );
    act(() => mocks.editor.onChange('Queued question'));
    expect(container.querySelector('.stop-box')).toBeNull();
    fireEvent.click(container.querySelector('[data-chat-footer] .send-box')!);
    expect(mocks.send).toHaveBeenCalledWith(
      'Queued question',
      [],
      [],
      undefined,
      'yolo',
    );
  });

  it('restores queue snapshots only for this session and clears only its own activity on unmount', () => {
    const selectModel = vi.fn();
    const selectMode = vi.fn();
    const reset = vi.fn();
    const { unmount } = render(
      <ChatInputHomeIndependent
        onEnter={mocks.send}
        getCurrentConversationId={() => 44}
        disabledConversationActive={reset}
        onModelSelect={selectModel}
        onAgentModeChange={selectMode}
      />,
    );
    const edit = vi
      .mocked(eventBus.on)
      .mock.calls.find(([name]) => name === 'queue-edit')![1];
    act(() =>
      edit({ conversationId: 99, text: 'Another session', modelId: 4 }),
    );
    expect(mocks.editor.value).toBe('');
    expect(selectModel).not.toHaveBeenCalled();
    act(() =>
      edit({
        conversationId: 44,
        text: 'My queued draft',
        skillIds: [71],
        modelId: 5,
        selectedAgentMode: 'ask',
      }),
    );
    expect(mocks.editor.value).toBe('My queued draft');
    expect(selectModel).toHaveBeenCalledWith(5);
    expect(selectMode).toHaveBeenCalledWith('ask');
    act(() => mocks.editor.onPressEnter());
    expect(mocks.send.mock.calls[0][2]).toEqual([71]);
    unmount();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
