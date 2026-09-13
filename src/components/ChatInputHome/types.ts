import type { ChatInputProps } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';

/** 输入框只读取所属会话的数据，主会话与预览会话分别提供各自的状态。 */
export interface ChatInputSessionSource {
  runStopConversation?: (id: string) => Promise<unknown>;
  onUserStopConversation?: () => void;
  loadingStopConversation?: boolean;
  getCurrentConversationId?: () => number | null;
  getCurrentConversationRequestId?: () => string;
  isConversationActive?: boolean;
  disabledConversationActive?: () => void;
  messageList?: MessageInfo[];
  loadingConversation?: boolean;
  isLoadingOtherInterface?: boolean;
  conversationInfo?: ConversationInfo | null;
}

export interface ChatInputComposerProps extends ChatInputProps {
  session: ChatInputSessionSource;
  /** 示例页使用模拟语音，不访问麦克风。 */
  voiceInputMock?: boolean;
}
