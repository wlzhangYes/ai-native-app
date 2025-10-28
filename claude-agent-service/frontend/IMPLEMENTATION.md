# Frontend Implementation Guide

## Overview

This document provides a comprehensive guide to the Claude Agent Service frontend implementation, including architecture, component details, and integration with the backend.

## Architecture

### Component Hierarchy

```
Home (page.tsx)
├── ChatContext.Provider
    ├── SessionList (Left Column)
    ├── ChatPanel (Middle Column)
    │   ├── Message[]
    │   │   └── ToolCallCard[]
    │   └── StreamingText (current)
    └── Sidebar (Right Column)
        ├── TodoList (Tab)
        │   └── Todo Items
        └── FileExplorer (Tab)
            └── File Tree
```

### State Management

#### Global State (ChatContext)
- `messages`: All conversation messages
- `currentToolCalls`: Currently executing tool calls

#### Local State
- `currentSessionId`: Active session ID
- `sidebarView`: Current sidebar tab ('todos' | 'files')
- `input`: Chat input text
- `isStreaming`: Streaming status

## Core Components

### 1. SessionList (`src/components/SessionList.tsx`)

**Purpose**: Manage and display chat sessions

**Key Features**:
- Create new sessions
- Display session list with metadata
- Delete sessions
- Show last activity and message count
- Highlight active session

**Props**:
```typescript
interface SessionListProps {
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
}
```

**API Calls**:
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `DELETE /api/sessions/{id}` - Delete session

### 2. ChatPanel (`src/components/ChatPanel.tsx`)

**Purpose**: Main chat interface with streaming

**Key Features**:
- Display message history
- Real-time text streaming
- Tool call visualization
- Input with auto-resize
- Send/Stop controls
- Session-scoped messages

**Props**:
```typescript
interface ChatPanelProps {
  sessionId: string | null;
  chatStream: ReturnType<typeof useChatStream>;
}
```

**Behavior**:
- Clears messages when session changes
- Auto-scrolls to bottom
- Handles Enter/Shift+Enter for send/newline

### 3. Message (`src/components/Message.tsx`)

**Purpose**: Display individual chat messages

**Key Features**:
- User/Assistant avatars
- Markdown rendering with code highlighting
- Tool call cards
- Statistics display (cost, duration, tokens)
- Timestamp

**Props**:
```typescript
interface MessageProps {
  message: Message;
}
```

**Message Structure**:
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: ToolCall[];
  stats?: Statistics;
  timestamp: Date;
}
```

### 4. ToolCallCard (`src/components/ToolCallCard.tsx`)

**Purpose**: Beautiful tool call visualization

**Key Features**:
- Status-based coloring
- Animated parameter building
- Collapsible input/output
- Error handling

**Status Colors**:
- `building`: Orange border, spinning loader
- `executing`: Blue border, spinning loader
- `success`: Green border, check icon
- `failed`: Red border, X icon

**Tool Call Structure**:
```typescript
interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  inputPartial?: string;
  result?: string;
  isError?: boolean;
  status: 'building' | 'executing' | 'success' | 'failed';
}
```

### 5. StreamingText (`src/components/StreamingText.tsx`)

**Purpose**: Animated streaming text with cursor

**Features**:
- Real-time text update
- Blinking cursor animation
- Smooth rendering

### 6. TodoList (`src/components/TodoList.tsx`)

**Purpose**: Monitor todos from TodoWrite tool calls

**Key Features**:
- Progress bar
- Status icons (✅ completed, 🔧 in_progress, ⭕ pending)
- Completed/in-progress/pending counts
- Real-time updates

**Todo Extraction**:
```typescript
// Extracts from ToolCall.name === 'TodoWrite'
// Looking for ToolCall.input.todos array
interface Todo {
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}
```

### 7. FileExplorer (`src/components/FileExplorer.tsx`)

**Purpose**: Browse workspace files

**Features**:
- Directory tree
- File metadata
- Refresh button
- Size formatting

**Note**: Backend endpoint needs implementation

### 8. Sidebar (`src/components/Sidebar.tsx`)

**Purpose**: Right sidebar with tabs

**Features**:
- Tab navigation (Todos/Files)
- Active tab highlighting
- Content switching

## Hooks

### 1. useChatStream (`src/hooks/useChatStream.ts`)

**Purpose**: Handle SSE streaming from backend

**Key Functions**:
- `sendMessage(message, sessionId, options)` - Send chat message
- `stopStreaming()` - Abort current stream
- `clearMessages()` - Clear message history

**State**:
- `messages`: Array of completed messages
- `isStreaming`: Boolean indicating active stream
- `currentText`: Currently streaming text
- `currentToolCalls`: Array of current tool calls
- `statistics`: Usage statistics

**SSE Event Handling**:

```typescript
switch (event.type) {
  case 'text_delta':
    // Append text chunk
    setCurrentText(prev => prev + event.content);
    break;

  case 'content_block_start':
    // Start new content block (text or tool)
    if (event.block_type === 'tool_use') {
      // Create new tool call with 'building' status
    }
    break;

  case 'tool_input_delta':
    // Stream tool parameters
    // Append partial JSON to inputPartial
    break;

  case 'tool_use':
    // Complete tool call with full input
    // Change status to 'executing'
    break;

  case 'tool_result':
    // Update with execution result
    // Change status to 'success' or 'failed'
    break;

  case 'result':
    // Set statistics (cost, duration, tokens)
    break;

  case 'done':
    // Finalize message and reset
    break;
}
```

### 2. useSessions (`src/hooks/useSessions.ts`)

**Purpose**: Session CRUD operations

**Key Functions**:
- `fetchSessions()` - Load all sessions
- `createSession(workspaceName?)` - Create new session
- `deleteSession(sessionId)` - Delete session
- `getSession(sessionId)` - Get session details

**State**:
- `sessions`: Array of sessions
- `loading`: Boolean
- `error`: Error message

### 3. useTodos (`src/hooks/useTodos.ts`)

**Purpose**: Extract and track todos from tool calls

**Key Functions**:
- Extracts todos from TodoWrite tool calls
- Calculates progress statistics

**Returns**:
```typescript
{
  todos: Todo[];
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  totalCount: number;
}
```

## API Service (`src/services/api.ts`)

### Session APIs

```typescript
sessionApi.list(activeOnly: boolean): Promise<{ sessions: Session[]; total: number }>
sessionApi.get(sessionId: string): Promise<Session>
sessionApi.create(data: { session_id?: string; workspace_name?: string }): Promise<Session>
sessionApi.delete(sessionId: string): Promise<void>
```

### Chat APIs

```typescript
chatApi.streamWithFetch(params: {
  message: string;
  session_id?: string;
  permission_mode?: string;
  resume?: string;
  max_turns?: number;
}): Promise<ReadableStream<Uint8Array>>
```

### File APIs (Placeholder)

```typescript
fileApi.list(sessionId: string, path?: string): Promise<any[]>
fileApi.read(sessionId: string, filePath: string): Promise<string>
```

## SSE Event Types

### Backend Events

The backend emits these SSE events:

1. **text_delta**
   ```json
   {
     "type": "text_delta",
     "content": "text chunk",
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

2. **content_block_start**
   ```json
   {
     "type": "content_block_start",
     "block_type": "tool_use",
     "index": 0,
     "tool": {
       "id": "...",
       "name": "ToolName"
     },
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

3. **tool_input_delta**
   ```json
   {
     "type": "tool_input_delta",
     "partial_json": "{\"key\":",
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

4. **tool_use**
   ```json
   {
     "type": "tool_use",
     "tool": {
       "id": "...",
       "name": "ToolName",
       "input": {...}
     },
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

5. **tool_result**
   ```json
   {
     "type": "tool_result",
     "tool_use_id": "...",
     "content": "result",
     "is_error": false,
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

6. **result**
   ```json
   {
     "type": "result",
     "data": {
       "subtype": "success",
       "is_error": false,
       "duration_ms": 1234,
       "total_cost_usd": 0.0123,
       "num_turns": 2,
       "usage": {...},
       "result": "..."
     },
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

7. **done**
   ```json
   {
     "type": "done",
     "session_id": "...",
     "conversation_id": "...",
     "claude_session_id": "..."
   }
   ```

8. **system**
   ```json
   {
     "type": "system",
     "subtype": "init",
     "data": {...},
     "session_id": "...",
     "conversation_id": "..."
   }
   ```

## Styling Guidelines

### Anthropic Brand Colors

```css
/* Primary Colors */
--anthropic-dark: #141413      /* Text, borders */
--anthropic-light: #faf9f5     /* Background */
--anthropic-orange: #d97757    /* Primary actions, active tools */
--anthropic-blue: #6a9bcc      /* Secondary, executing tools */
--anthropic-green: #788c5d     /* Success, completed */

/* Supporting Colors */
--anthropic-mid-gray: #b0aea5    /* Muted text */
--anthropic-light-gray: #e8e6dc  /* Borders, dividers */
```

### Typography

```css
/* Headings */
font-family: 'Poppins', Arial, sans-serif;
font-weight: 600;

/* Body Text */
font-family: 'Lora', Georgia, serif;

/* Code */
font-family: 'Monaco', 'Courier New', monospace;
```

### Common Patterns

```jsx
// Primary Button
<button className="bg-anthropic-orange text-white hover:opacity-90 px-6 py-3 rounded-lg font-poppins font-medium transition-all">

// Card
<div className="border border-anthropic-light-gray rounded-lg p-4 bg-white">

// Section Header
<h2 className="font-poppins font-semibold text-lg text-anthropic-dark">

// Muted Text
<p className="text-sm text-anthropic-mid-gray">
```

## Development Workflow

### Starting the Dev Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Integration with Backend

### Backend Requirements

The frontend expects these endpoints:

1. **Session Management**
   - `GET /api/sessions?active_only=true&limit=100`
   - `POST /api/sessions` with body: `{ session_id?, workspace_name? }`
   - `GET /api/sessions/{id}`
   - `DELETE /api/sessions/{id}`

2. **Chat Streaming**
   - `POST /api/chat/stream` with body:
     ```json
     {
       "message": "string",
       "session_id": "string?",
       "permission_mode": "string?",
       "resume": "string?",
       "max_turns": "number?"
     }
     ```
   - Returns: `text/event-stream` with SSE events

3. **File API (TODO)**
   - `GET /api/files/{session_id}?path=/`
   - `GET /api/files/{session_id}/read?path=/path/to/file`

### CORS Configuration

Backend must allow:
```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
```

## Testing

### Manual Testing Checklist

- [ ] Create new session
- [ ] Select session from list
- [ ] Send message
- [ ] Verify streaming text appears
- [ ] Verify tool calls are displayed
- [ ] Check tool parameters build in real-time
- [ ] Verify tool execution status updates
- [ ] Check tool results appear
- [ ] Verify statistics display
- [ ] Check todos extract from TodoWrite
- [ ] Verify progress bar updates
- [ ] Switch between Todos/Files tabs
- [ ] Delete session
- [ ] Clear messages on session switch

### Browser DevTools

1. **Network Tab**: Monitor SSE stream
   - Look for `/api/chat/stream` with type `eventsource`
   - Check individual events

2. **Console**: Check for errors
   - SSE parsing errors
   - API call failures
   - Component render errors

3. **React DevTools**: Inspect state
   - ChatContext values
   - Hook states
   - Component props

## Common Issues

### Issue: Messages not clearing on session switch

**Solution**: Verify `clearMessages()` is called in `ChatPanel` useEffect

### Issue: Todos not appearing

**Solution**:
1. Check tool call name is exactly "TodoWrite"
2. Verify input has `todos` array
3. Check ChatContext is providing data

### Issue: Streaming stops abruptly

**Solution**:
1. Check browser console for errors
2. Verify backend is sending proper SSE format
3. Check network connection

### Issue: Tool calls not updating

**Solution**:
1. Verify event types match backend
2. Check tool_use_id matches in tool_result
3. Inspect processEvent logic

## Performance Optimization

### Current Optimizations

1. **React.memo**: Not yet implemented, consider for large lists
2. **useCallback**: Used for event handlers
3. **Auto-scroll**: Only on new messages
4. **SSE Buffer**: Efficient line-by-line parsing

### Future Improvements

- [ ] Virtual scrolling for message list
- [ ] Message pagination
- [ ] Debounced input
- [ ] Code splitting for large dependencies
- [ ] Service worker for offline support

## Accessibility

### Implemented

- Semantic HTML elements
- ARIA labels on buttons
- Keyboard navigation support
- Focus indicators

### TODO

- [ ] Screen reader announcements for streaming
- [ ] High contrast mode
- [ ] Keyboard shortcuts
- [ ] Skip to content link

## Browser Support

**Tested**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**:
- EventSource API (SSE)
- CSS Grid & Flexbox
- ES2020 features

## Deployment

### Vercel

```bash
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Production:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

## Future Enhancements

### High Priority

1. **File Explorer Backend**: Implement backend endpoint
2. **Message Persistence**: Save/load conversation history
3. **Search**: Find messages and tool calls
4. **Export**: Download conversations

### Medium Priority

1. **Dark Mode**: Toggle theme
2. **Settings Panel**: Configure preferences
3. **Keyboard Shortcuts**: Quick actions
4. **Notifications**: Toast messages for errors

### Low Priority

1. **Multi-language**: i18n support
2. **Themes**: Custom color schemes
3. **Plugins**: Extensible tool visualizations
4. **Analytics**: Usage tracking

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Component Guidelines

1. One component per file
2. Props interface at top
3. Hooks before render logic
4. Event handlers below hooks
5. JSX at bottom

### Testing Guidelines

1. Test happy path
2. Test error cases
3. Test edge cases
4. Test accessibility

## License

MIT
