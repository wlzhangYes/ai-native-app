// Left Panel Component - AI Dialog Panel (Chat Interface Only)
// Based on spec.md FR-006 to FR-013: AI dialog with ChatInterface
// Layout: Full-width ChatInterface with collapsible SessionsDrawer

import { ChatInterface } from '../dialog/ChatInterface';

export function LeftPanel() {
  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}
