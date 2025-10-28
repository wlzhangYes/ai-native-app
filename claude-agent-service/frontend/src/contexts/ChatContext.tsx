import { createContext, useContext } from 'react';
import { Message, ToolCall } from '@/types';

// Create context for chat data
interface ChatContextType {
  messages: Message[];
  currentToolCalls: ToolCall[];
}

const ChatContext = createContext<ChatContextType>({ messages: [], currentToolCalls: [] });

export const useChatContext = () => useContext(ChatContext);

export default ChatContext;
