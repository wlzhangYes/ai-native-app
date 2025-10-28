'use client';

import { useState } from 'react';
import SessionList from '@/components/SessionList';
import ChatPanel from '@/components/ChatPanel';
import Sidebar from '@/components/Sidebar';
import { useChatStream } from '@/hooks/useChatStream';
import ChatContext from '@/contexts/ChatContext';

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<'todos' | 'files'>('todos');

  // Use chat stream at the top level
  const chatStream = useChatStream();

  return (
    <ChatContext.Provider
      value={{
        messages: chatStream.messages,
        currentToolCalls: chatStream.currentToolCalls,
      }}
    >
      <div className="flex h-screen bg-anthropic-light overflow-hidden">
        {/* Left: Session List - Fixed width */}
        <div className="w-64 flex-shrink-0 border-r border-anthropic-light-gray bg-white overflow-y-auto">
          <SessionList
            currentSessionId={currentSessionId}
            onSessionSelect={setCurrentSessionId}
          />
        </div>

        {/* Middle: Chat Panel - Flexible */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel sessionId={currentSessionId} chatStream={chatStream} />
        </div>

        {/* Right: Sidebar (Todos / Files) - Fixed width */}
        <div className="w-80 flex-shrink-0 border-l border-anthropic-light-gray bg-white overflow-y-auto">
          <Sidebar
            sessionId={currentSessionId}
            view={sidebarView}
            onViewChange={setSidebarView}
          />
        </div>
      </div>
    </ChatContext.Provider>
  );
}
