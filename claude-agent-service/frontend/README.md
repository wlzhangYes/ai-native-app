# Claude Agent Service - Frontend

A beautiful, production-ready Next.js frontend for the Claude Agent Service with real-time streaming, tool call visualization, and task monitoring.

## Features

- **Three-Column Layout**
  - Left: Session management with create/delete operations
  - Middle: Chat interface with streaming responses
  - Right: Todo monitoring and file explorer

- **Real-Time Streaming**
  - Server-Sent Events (SSE) for live text streaming
  - Animated tool call parameter building
  - Real-time tool execution status updates

- **Tool Call Visualization**
  - Beautiful cards showing tool name and status
  - Animated parameter building display
  - Collapsible input/output details
  - Status indicators: building → executing → success/failed

- **Todo Monitoring**
  - Automatically extracts todos from TodoWrite tool calls
  - Shows progress with visual indicators
  - Status icons for pending, in-progress, and completed tasks
  - Real-time updates during conversation

- **Anthropic Brand Design**
  - Colors: Dark #141413, Light #faf9f5, Orange #d97757, Blue #6a9bcc, Green #788c5d
  - Fonts: Poppins for headings, Lora for body text
  - Custom scrollbars and beautiful animations

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with Anthropic brand colors
- **Icons**: Lucide React
- **Markdown**: react-markdown for message rendering
- **State Management**: React hooks

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page with three-column layout
│   ├── components/
│   │   ├── SessionList.tsx    # Session management
│   │   ├── ChatPanel.tsx      # Chat interface
│   │   ├── Message.tsx        # Message display
│   │   ├── ToolCallCard.tsx   # Tool call visualization
│   │   ├── StreamingText.tsx  # Animated streaming text
│   │   ├── TodoList.tsx       # Todo monitoring
│   │   ├── FileExplorer.tsx   # File browser
│   │   └── Sidebar.tsx        # Right sidebar with tabs
│   ├── hooks/
│   │   ├── useChatStream.ts   # SSE streaming handler
│   │   ├── useSessions.ts     # Session CRUD operations
│   │   └── useTodos.ts        # Todo extraction and tracking
│   ├── services/
│   │   └── api.ts             # API client
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── styles/
│       └── globals.css        # Global styles and fonts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── postcss.config.js
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Integration

The frontend connects to the backend API at `/api/sessions` and `/api/chat/stream`.

### Session APIs
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/{id}` - Get session details
- `DELETE /api/sessions/{id}` - Delete session

### Chat APIs
- `POST /api/chat/stream` - Stream chat responses via SSE

### SSE Event Types

The chat stream emits the following events:

- `text_delta` - Streaming text chunks
- `content_block_start` - New content block (text or tool)
- `tool_input_delta` - Tool parameter streaming
- `tool_use` - Complete tool call
- `tool_result` - Tool execution result
- `result` - Final statistics
- `done` - Stream completion
- `system` - System messages

## Components

### SessionList
Displays all sessions with:
- Create new session button
- Session cards with metadata
- Delete session action
- Last activity timestamp

### ChatPanel
Main chat interface with:
- Message history
- Streaming responses
- Input area with auto-resize
- Send/Stop controls

### Message
Displays individual messages with:
- User/Assistant avatar
- Markdown rendering
- Tool call cards
- Statistics (cost, duration, tokens)

### ToolCallCard
Beautiful tool visualization:
- Tool name and icon
- Status indicator with colors
- Animated parameter building
- Collapsible input/output
- Error handling

### TodoList
Task monitoring with:
- Progress bar
- Status icons (✅ 🔧 ⭕)
- Completed/in-progress/pending counts
- Real-time updates

### FileExplorer
Workspace file browser:
- Directory tree
- File metadata
- Refresh button
- (Backend endpoint needed)

## Styling Guidelines

### Colors
- Background: `bg-anthropic-light` (#faf9f5)
- Text: `text-anthropic-dark` (#141413)
- Primary: `bg-anthropic-orange` (#d97757)
- Secondary: `bg-anthropic-blue` (#6a9bcc)
- Success: `text-anthropic-green` (#788c5d)

### Typography
- Headings: `font-poppins`
- Body: `font-lora`
- Code: `font-mono`

### Spacing
- Container padding: `p-4`
- Gap between elements: `gap-3` or `gap-4`
- Border radius: `rounded-lg`

## Building for Production

```bash
npm run build
npm start
```

## Development Tips

1. **Hot Reload**: Changes auto-reload in development
2. **Type Safety**: TypeScript errors show in terminal
3. **Tailwind**: Use Anthropic brand color classes
4. **SSE Debugging**: Check browser console for event logs
5. **Tool Monitoring**: TodoWrite calls auto-populate todos

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern browsers with EventSource support

## Performance

- Lazy loading for large message lists
- Efficient SSE parsing
- Optimized re-renders with React hooks
- Tailwind CSS purging for small bundle size

## Future Enhancements

- [ ] File explorer backend implementation
- [ ] Message search functionality
- [ ] Export conversation history
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts
- [ ] Multi-language support

## License

MIT
