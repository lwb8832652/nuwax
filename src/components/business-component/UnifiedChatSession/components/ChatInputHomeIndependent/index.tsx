import {
  ChatInputComposer,
  type ChatInputHomeRef,
} from '@/components/ChatInputHome';
import type {
  ChatInputComposerProps,
  ChatInputSessionSource,
} from '@/components/ChatInputHome/types';
import { forwardRef } from 'react';

export interface ChatInputHomeIndependentProps
  extends Omit<ChatInputComposerProps, 'session'>,
    ChatInputSessionSource {}

/** 独立会话仅负责状态适配，输入框布局与所有交互共用工作台的实现。 */
const ChatInputHomeIndependent = forwardRef<
  ChatInputHomeRef,
  ChatInputHomeIndependentProps
>(
  (
    {
      runStopConversation,
      onUserStopConversation,
      loadingStopConversation,
      getCurrentConversationId,
      getCurrentConversationRequestId,
      isConversationActive,
      disabledConversationActive,
      messageList,
      loadingConversation,
      isLoadingOtherInterface,
      conversationInfo,
      showResourceMention = true,
      ...props
    },
    ref,
  ) => (
    <ChatInputComposer
      {...props}
      ref={ref}
      showResourceMention={showResourceMention}
      session={{
        runStopConversation,
        onUserStopConversation,
        loadingStopConversation,
        getCurrentConversationId,
        getCurrentConversationRequestId,
        isConversationActive,
        disabledConversationActive,
        messageList,
        loadingConversation,
        isLoadingOtherInterface,
        conversationInfo,
      }}
    />
  ),
);

export default ChatInputHomeIndependent;
