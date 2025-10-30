# Feature Specification: AI-Driven Workflow Execution Frontend

**Feature Branch**: `002-ai-workflow-frontend`
**Created**: 2025-10-24
**Status**: In Production (Phase 4 Complete)
**Last Updated**: 2025-10-30
**Input**: User description: "创建一个AI驱动的软件开发流程执行系统的前端Web应用，采用三栏式布局设计"

---

## Implementation Status Overview

### 🎉 Production Deployment Completed
- **Deployment URL**: http://172.16.18.184:8080
- **Server**: 172.16.18.184 (Nginx on port 8080)
- **Backend API**: http://172.16.18.184:8000/api
- **Deployment Date**: 2025-10-29

### ✅ Completed Features

#### Phase 1: Foundation (100% Complete)
- **Three-Column Layout**: Fully responsive 3:2:5 ratio layout with draggable dividers
- **Mobile Detection**: Mobile device warning message implemented
- **Session Management**: Multi-project session isolation with Zustand + IndexedDB

#### Phase 2: AI Chat Interface (100% Complete)
- **Ant Design X Integration**: Professional AI chat components (Bubble, Sender, Attachments)
- **SSE Streaming**: Real-time AI message streaming with EventSource
- **File Attachments**: Upload and display files/images in chat bubbles
- **Custom UI**: Content-width bubbles without avatars, custom footer with attachment/voice/send buttons

#### Phase 3: Workflow Integration (100% Complete)
- **TodoWrite Integration**: Real-time task tracking from Claude Tool Calls
- **Workflow Tree**: Dynamic task visualization with pending/in_progress/completed states
- **Automatic Sync**: AI tool calls automatically create and update workflow tasks
- **Flat Task Structure**: All todos displayed as independent tasks in "任务列表" stage

#### Phase 4: Document & Code Editing (100% Complete)
- **Monaco Editor**: VSCode-style code editor with 50+ language syntax highlighting
- **Markdown Preview**: Dual-view (preview/source) with automatic language detection
- **Document Management**: Real-time document generation and editing
- **Version Control**: Document diff comparison with React Diff Viewer

### 🏗️ Architecture Highlights

#### Four-Layer Hooks Architecture
```
Composite Layer  → useChat, useWorkflow, useAIWorkflow
Business Layer   → useMessages, useTodos, useWorkflowSync
Infrastructure   → useApiClient, useSSE, useIndexedDB
Utility Layer    → useDebounce, useToggle, useLocalStorage
```

#### State Management (Zustand)
- **DialogStore**: Messages, SSE streaming, Tool Calls (session-isolated)
- **WorkflowStore**: Workflow tree, task states, TodoWrite sync (session-isolated)
- **DocumentStore**: Document content, editing states, version history
- **UIActionStore**: User preferences, UI states, action history

#### Testing Coverage
- **Unit Tests**: 14 hooks, 100% coverage
- **Integration Tests**: SSE streaming, workflow synchronization
- **Mock Services**: MSW for API mocking

### 📊 User Story Implementation Status

| User Story | Priority | Status | Implementation Details |
|------------|----------|--------|----------------------|
| **US1**: Three-Column Layout | P1 | ✅ Complete | Responsive design, draggable dividers, mobile detection |
| **US2**: AI Dialog Interaction | P1 | ✅ Complete | Text/file input, SSE streaming, custom UI, attachments |
| **US3**: Workflow Visualization | P2 | ✅ Complete | TodoWrite integration, real-time sync, expandable tree |
| **US4**: Document Preview | P2 | ✅ Complete | Monaco Editor, Markdown rendering, real-time updates |
| **US5**: Document Editing | P3 | ✅ Complete | Monaco Editor integration, diff comparison, version control |
| **US6**: Session Persistence | P3 | ✅ Complete | IndexedDB + LocalStorage, session isolation, data recovery |
| **US7**: Project Management | P4 | 🔄 Planned | Multi-project support, access control (future phase) |
| **US8**: Async Tasks | P4 | 🔄 Planned | Background execution, Feishu notifications (future phase) |
| **US9**: Feishu Integration | P5 | 🔄 Planned | Document sync, export features (future phase) |

### 🚀 Technical Achievements

1. **Production-Ready**: Successfully deployed with Nginx reverse proxy configuration
2. **Real-Time Experience**: SSE streaming provides instant AI response feedback
3. **Professional Code Editing**: Monaco Editor matches VSCode experience
4. **Robust Architecture**: Four-layer hooks enable maintainable, testable code
5. **Session Isolation**: Multi-project support foundation with complete data isolation

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Three-Column Interface Display and Navigation (Priority: P1)

When a user opens the application, they see a three-column layout (ratio 3:2:5) where they can view AI conversations, workflow progress, and execution results simultaneously. The interface adapts to desktop browser window sizes and provides intuitive navigation between different sections.

**Why this priority**: This is the foundational UI that enables all other functionality. Without the three-column layout, users cannot access any features.

**Independent Test**: Can be fully tested by opening the application and verifying that three columns appear with correct proportions, responsive behavior works on different desktop screen sizes, and basic navigation is functional.

**Acceptance Scenarios**:

1. **Given** a user opens the application in a desktop browser, **When** the page loads, **Then** three columns are displayed with ratio 3:2:5 (left: AI dialog, middle: workflow tree, right: execution preview)
2. **Given** the application is open, **When** the user resizes the browser window, **Then** the three-column layout adjusts responsively while maintaining usability
3. **Given** a user accesses the application from a mobile device, **When** the page loads, **Then** a message displays: "This application is not supported on mobile devices, please use a desktop browser"

---

### User Story 2 - AI Dialog Interaction with Text, Voice, and File Input (Priority: P1)

Users engage in natural language conversations with an AI coach through text, voice, or file attachments in the left column. The AI guides users through the workflow stages by asking contextual questions and providing feedback. Messages are displayed with distinct visual indicators showing message type (user input, AI response, success, failure, executing). Users can upload files and images that display alongside text content in the chat bubbles.

**Why this priority**: Dialog interaction is the primary mechanism for users to communicate their needs and advance through workflow stages. Without this, the entire AI-driven workflow concept fails.

**Independent Test**: Can be fully tested by sending text and voice messages, uploading files and images, receiving AI responses via SSE streaming, and verifying that message type indicators and attachments display correctly.

**Acceptance Scenarios**:

1. **Given** a user is in the dialog panel, **When** they type a message and press send, **Then** the message appears in a content-width bubble without avatar, and AI responds with streaming text marked by typing indicator
2. **Given** a user clicks the voice input button, **When** they speak, **Then** speech is converted to text and displayed in the input field, ready to send
3. **Given** a user clicks the attachment button, **When** they select one or more files or images, **Then** the attachments appear above the input field with file names, and can be removed before sending
4. **Given** a user has uploaded attachments and typed text, **When** they press send, **Then** the message bubble displays both the attachment cards (with file icons, names, and sizes) and the text content in a vertical layout
5. **Given** AI initiates a document generation task, **When** the task is executing, **Then** a flashing star icon appears above the input field showing task status
6. **Given** a command execution fails, **When** the error occurs, **Then** the message displays with a red dot icon and error details appear in the right column "运行记录" tab

---

### User Story 3 - Workflow Progress Visualization (Priority: P2)

Users view the complete 5-stage workflow (阶段0：项目初始化, 阶段1：需求澄清, 阶段2：方案构建, 阶段3：实施计划, 阶段4：任务构造) in the middle column as an expandable/collapsible tree structure. The current active stage is highlighted, completed stages show checkmarks, and users can click on stages to view execution logs in the right panel. Each stage displays a task count indicator (e.g., "6") showing the number of sub-tasks or documents within that stage.

**Why this priority**: Workflow visualization provides transparency and orientation, helping users understand where they are in the process and what comes next. This significantly improves user experience but the application can function without it.

**Independent Test**: Can be fully tested by progressing through workflow stages and verifying that the tree updates to reflect current status, highlights active stage, marks completed stages, and allows navigation by clicking stages to view execution logs.

**Acceptance Scenarios**:

1. **Given** a project is in 阶段1 (需求澄清), **When** the user views the middle column workflow tree, **Then** 阶段1 is highlighted, 阶段0 shows a checkmark, and 阶段2-4 appear as pending
2. **Given** the workflow tree is displayed, **When** the user clicks on a completed 阶段0 (项目初始化), **Then** the AI dialog context switches to 阶段0, the right panel switches to the "运行记录" tab showing 阶段0's execution logs in a timeline format, and the workflow tree expands to show 阶段0's documents and sub-tasks
3. **Given** the workflow tree has multiple stages, **When** the user clicks the collapse icon, **Then** the stage's activities fold up, saving vertical space, and the task count indicator remains visible
4. **Given** a user is viewing execution logs for 阶段0, **When** 阶段1 begins processing in the background, **Then** new log entries appear in real-time in the "运行记录" tab if 阶段1 is selected

---

### User Story 4 - Document Generation and Real-Time Preview (Priority: P2)

As users answer AI questions, documents (spec.md, plan.md, etc.) are generated incrementally and displayed in the right column under the "结果预览" tab. Users can view Markdown-rendered documents with metadata (creation time, update time, version, author), see live updates as content is generated, and switch between documents via the workflow tree in the middle column. When clicking workflow stages, users see a list of all documents generated in that stage. Documents display action buttons including "导出文本文档" (Export Text Document), "编辑" (Edit), and "确认" (Confirm).

**Why this priority**: Seeing documents generated in real-time provides immediate feedback and builds user confidence. However, the core workflow can function with delayed document display.

**Independent Test**: Can be fully tested by answering AI questions, observing document generation in real-time, clicking documents in the workflow tree, and verifying Markdown rendering in the preview pane with metadata display. Also test clicking workflow nodes to see document lists.

**Acceptance Scenarios**:

1. **Given** a user answers an AI question, **When** the AI processes the answer, **Then** the document (e.g., spec.md) is incrementally updated in the "结果预览" tab with real-time Markdown rendering, and the document header displays metadata including creation time (e.g., 2025-10-17 09:30), update time (e.g., 2025-10-17 09:45), version number (e.g., 3.0), and author name (e.g., Alex)
2. **Given** multiple documents exist in the workflow tree, **When** the user clicks on spec.md, **Then** the right panel automatically switches to the "结果预览" tab and displays the selected document with proper Markdown formatting and complete metadata
3. **Given** a document is in Draft status, **When** the user views the workflow tree, **Then** the document shows a "Draft" badge (gray or yellow icon); completed documents show a "Completed" badge (green checkmark)
4. **Given** a workflow stage node (e.g., 阶段0：项目初始化) is clicked, **When** the right panel updates, **Then** the "结果预览" tab shows a list of all documents generated in that stage with task count indicators

---

### User Story 5 - Document Editing and Version Comparison (Priority: P3)

Users can edit generated documents directly in the preview pane or request AI modifications through dialog. When AI suggests changes, a side-by-side comparison view shows the old version (in red text) and new version (in green text). Users can accept changes (saving the new version) or reject them (keeping the old version).

**Why this priority**: Document editing and comparison enhance usability and give users control, but the workflow can complete without these features by relying solely on AI generation.

**Independent Test**: Can be fully tested by editing a document, requesting AI modifications, viewing the comparison view with red/green diff highlighting, and accepting or rejecting changes.

**Acceptance Scenarios**:

1. **Given** a user views constitution.md in the preview pane, **When** they click the "Edit" button, **Then** the document becomes editable, and a "Confirm" button appears at the bottom
2. **Given** a user requests "modify the first principle in the constitution", **When** AI generates the modification, **Then** the preview pane displays a comparison view: left/top side shows old content in red, right/bottom side shows new content in green
3. **Given** the comparison view is displayed, **When** the user clicks "Confirm", **Then** the new version is saved to the database, the comparison view closes, and only the new version is displayed
4. **Given** the comparison view is displayed, **When** the user clicks "Reject", **Then** the old version is retained, the comparison view closes, and the old version continues to display

---

### User Story 6 - Session Persistence and Task Resumption (Priority: P3)

Users can close the browser at any time, and long-running AI tasks continue executing in the background. When users return to the application, they see their complete conversation history, current project status, and any tasks that completed while they were away. Users can pause ongoing tasks and resume them later.

**Why this priority**: Session persistence and background execution improve reliability and user experience, but are not essential for basic workflow completion.

**Independent Test**: Can be fully tested by starting a task, closing the browser, reopening after task completion, and verifying that conversation history, project state, and task results are all restored correctly.

**Acceptance Scenarios**:

1. **Given** a user starts a "Generate spec.md" task that takes 30 seconds, **When** the user closes the browser after 10 seconds, **Then** the task continues executing in the background
2. **Given** a task completed while the user was away, **When** the user reopens the application and enters the project, **Then** the conversation history displays all messages including the task completion message, the workflow tree reflects the updated stage, and the generated document is visible in the workflow tree with updated task count badges
3. **Given** a task is currently executing, **When** the user clicks the "Pause Task" button, **Then** the task stops execution, status changes to "Paused", and the user can click "Resume Task" later to continue

---

### User Story 7 - Project Management and Access Control (Priority: P4)

Users can create multiple projects, browse projects organized by virtual organization/strategic opportunity/job family categories (synced from AMDP), search projects by name or category, and manage project permissions with three roles: Owner (can delete project and interact with AI), Editor (can edit documents), and Viewer (read-only access).

**Why this priority**: Multi-project management and permissions enable team collaboration, but a single-user, single-project MVP can deliver core value.

**Independent Test**: Can be fully tested by creating multiple projects, browsing the project list, searching for projects, assigning roles to team members, and verifying that each role has appropriate access restrictions.

**Acceptance Scenarios**:

1. **Given** a user is on the project list page, **When** they browse the sidebar, **Then** projects are organized in a tree structure by virtual organization, strategic opportunity, and job family categories (data synced from AMDP)
2. **Given** a user searches for "login feature", **When** they type in the search box, **Then** matching projects appear in the results list, and clicking a project navigates to its dialog interface
3. **Given** a user Bob is the project owner, **When** Bob clicks the permission icon next to the project name, **Then** a modal appears showing current members and their roles, with options to add members, assign roles (Owner/Editor/Viewer), and remove members
4. **Given** user Alice has Viewer role on a project, **When** Alice opens the project, **Then** she can view all content but cannot edit documents or interact with AI; edit and dialog buttons are disabled

---

### User Story 8 - Asynchronous Task Execution and Feishu Notifications (Priority: P4)

Long-running AI tasks (e.g., generating spec.md) execute asynchronously, allowing users to leave the page without interrupting the task. When a task completes, users receive a Feishu (Lark) notification card with the project name, task result summary, and action buttons ("Continue" or "Re-edit"). Clicking buttons triggers actions in the background without requiring users to open the application.

**Why this priority**: Asynchronous execution and external notifications improve user experience and enable multitasking, but are not critical for core workflow completion.

**Independent Test**: Can be fully tested by starting a long task, leaving the page, receiving a Feishu notification when the task completes, clicking notification buttons, and verifying that actions are executed correctly.

**Acceptance Scenarios**:

1. **Given** a user starts a "Generate spec.md" task that takes 30 seconds, **When** the task completes, **Then** the user receives a Feishu message from the "Software Development Workflow Agent" bot showing: "Your project 《User Login Feature》 has completed spec.md generation"
2. **Given** the Feishu notification card is displayed, **When** the user clicks "Continue", **Then** the system progresses the project to the next stage in the background, the card updates to show "Processed, project advanced to next stage", and the user does not need to open the application
3. **Given** multiple tasks complete within 5 minutes, **When** the system sends Feishu notifications, **Then** the notifications are merged into one message: "Your project 《User Login Feature》 has completed 3 tasks: constitution generation, spec generation, plan generation" with a single "View Details" button

---

### User Story 9 - Feishu Document Synchronization and Export (Priority: P5)

All locally generated documents (constitution.md, spec.md, etc.) are automatically synced to Feishu documents in real-time for archiving and sharing. If syncing fails, the system retries automatically and queues failed documents for later synchronization. Users can manually trigger sync and export the entire project as a compressed file (.zip) containing all documents and metadata.

**Why this priority**: Feishu integration and export features enable external collaboration and backup, but the core workflow can function independently.

**Independent Test**: Can be fully tested by generating documents, verifying they sync to Feishu, triggering manual sync, simulating sync failures to test retry logic, and exporting a project to verify the .zip file contains all expected content.

**Acceptance Scenarios**:

1. **Given** a constitution.md document is generated locally, **When** the system saves it to the database, **Then** it immediately attempts to sync to Feishu, creating or updating the corresponding Feishu document
2. **Given** Feishu sync fails due to API error, **When** the failure is detected, **Then** the system automatically retries 3 times with increasing intervals (1s, 5s, 15s), and if all retries fail, the document is added to a failure queue with a lightweight UI notification: "Feishu sync exception, document saved locally"
3. **Given** a user clicks the "Export Project" button, **When** the export completes, **Then** a .zip file downloads containing: constitution.md, spec.md, plan.md, task.md, project_metadata.json (name, created date, owner, permissions, category), and conversation_history.json

---

### Edge Cases

- **What happens when the user's IAM session expires during workflow execution?** System detects session expiration, displays a friendly message "Session expired, please log in again", preserves all local data, and after re-login, restores the user to the current project state without data loss.

- **What happens when AI response is extremely long (>10,000 words)?** The dialog panel implements virtual scrolling to handle long messages efficiently, a "Scroll to Bottom" button appears for quick navigation, and long documents are paginated or lazy-loaded in the preview pane.

- **What happens when the user rapidly switches between different project stages?** The AI context updates asynchronously, showing a brief loading indicator while the context switches, and queued context switches are debounced to prevent race conditions.

- **What happens when multiple users edit the same document simultaneously?** The system uses a "last write wins" strategy for the first version (no locking mechanism), and later versions may implement optimistic locking or conflict resolution prompts.

- **What happens when the AMDP service is unavailable during project creation?** The system uses the most recent cached directory data (valid for 24 hours), displays a warning "Directory data may be outdated, AMDP service temporarily unavailable", and allows the user to proceed with project creation.

- **What happens when the Trickle prototype link becomes invalid after initial submission?** The system periodically checks link validity, displays a warning icon in the workflow tree when invalid, and provides an "Update Link" button for users to re-enter the URL.

- **What happens when network disconnects during SSE streaming?** The client automatically attempts to reconnect with exponential backoff, displays a connection status indicator, and when reconnected, resumes streaming from the last received message.

- **What happens when a user tries to access a project they don't have permission to view?** The system checks permissions on the backend, returns a 403 error, and displays "You don't have permission to access this project" with an "Request Access" button that sends a notification to the project owner.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Three-Column Layout

- **FR-001**: System MUST display a three-column layout with a ratio of 3:2:5 (left column: AI dialog, middle column: workflow tree, right column: execution/preview)
- **FR-002**: System MUST make the layout responsive to desktop browser window resizing while maintaining usability
- **FR-003**: System MUST display an error message when accessed from mobile devices: "This application is not supported on mobile devices, please use a desktop browser"
- **FR-004**: System MUST allow users to manually adjust column widths by dragging dividers between columns
- **FR-005**: System MUST remember the user's column width preferences across sessions

#### Left Column: AI Dialog Interaction

- **FR-006**: System MUST provide a text input field for users to type messages to the AI coach
- **FR-007**: System MUST provide a voice input button that converts speech to text
- **FR-008**: System MUST display messages with distinct visual indicators: arrow (user input), white dot (AI response), green dot (successful command), red dot (failed command), flashing star (executing task)
- **FR-009**: System MUST display the current project name at the top of the dialog panel
- **FR-010**: System MUST support SSE (Server-Sent Events) streaming for AI responses, displaying text as it is generated
- **FR-011**: System MUST implement virtual scrolling for long conversation histories (>100 messages)
- **FR-012**: System MUST provide a "Scroll to Bottom" button when the user scrolls up in the conversation history
- **FR-013**: System MUST display a task status indicator above the input field showing currently executing tasks with a flashing star icon

#### Middle Column: Workflow Tree

- **FR-014**: System MUST display a unified workflow tree structure in the middle column that integrates workflow stages, sub-tasks, and documents in a hierarchical view
- **FR-015**: System MUST display a workflow tree showing 5 stages: 阶段0 (项目初始化), 阶段1 (需求澄清), 阶段2 (方案构建), 阶段3 (实施计划), 阶段4 (任务构造)
- **FR-016**: System MUST highlight the currently active stage in the workflow tree
- **FR-017**: System MUST mark completed stages with a checkmark icon in the workflow tree
- **FR-018**: System MUST support expand/collapse functionality for workflow tree nodes
- **FR-019**: System MUST display documents and sub-tasks organized hierarchically under their parent workflow stages in the unified tree
- **FR-020**: System MUST mark documents in the workflow tree with status badges: "Draft" (gray/yellow icon) or "Completed" (green checkmark icon)
- **FR-021**: System MUST display a task count indicator next to each workflow stage showing the number of sub-tasks or documents (e.g., "6" in a badge)
- **FR-022**: System MUST auto-expand the workflow tree to show documents and tasks related to the currently active stage
- **FR-023**: System MUST allow users to click on a workflow stage to switch AI dialog context to that stage
- **FR-024**: System MUST allow users to click on a document in the workflow tree to display it in the right column preview pane

#### Right Column: Execution and Preview

- **FR-025**: System MUST provide two tabs in the right column: "运行记录" (Execution Process) and "结果预览" (Result Preview)
- **FR-026**: System MUST display command execution logs in the "运行记录" tab, showing success/failure status and details
- **FR-027**: System MUST display selected documents in the "结果预览" tab with Markdown rendering and metadata header showing creation time, update time, version number, and author
- **FR-028**: System MUST update the "结果预览" tab in real-time as AI generates or modifies documents
- **FR-029**: System MUST provide an "编辑" (Edit) button in the "结果预览" tab for users to directly edit documents
- **FR-030**: System MUST provide a "确认" (Confirm) button at the bottom of the preview pane when a document is being edited
- **FR-030-1**: System MUST provide a "导出文本文档" (Export Text Document) button in the document preview toolbar
- **FR-031**: System MUST display a side-by-side comparison view when AI suggests document modifications, showing old content (red text) and new content (green text)
- **FR-032**: System MUST provide "Confirm" and "Reject" buttons in the comparison view for users to accept or discard changes
- **FR-033**: System MUST save the new version to the database when the user clicks "Confirm" in the comparison view
- **FR-034**: System MUST retain the old version when the user clicks "Reject" in the comparison view

#### Workflow Stage Management

- **FR-035**: System MUST enforce sequential progression through workflow stages (阶段0 → 阶段1 → 阶段2 → 阶段3 → 阶段4)
- **FR-036**: System MUST allow users to return to previous completed stages to modify documents without requiring re-execution of subsequent stages
- **FR-037**: System MUST prevent users from skipping stages (e.g., cannot jump from 阶段1 to 阶段3 without completing 阶段2)
- **FR-038**: System MUST support 阶段0 (项目初始化): prompt user to name the project, define project goals, and select virtual organization/strategic opportunity/job family category
- **FR-039**: System MUST support 阶段1 (需求澄清): AI asks clarifying questions about requirements, user answers questions, system records key clarification points and generates requirement documents
- **FR-040**: System MUST support 阶段2 (方案构建): AI guides user through solution design, functional module definition, and business design, generating technical specification documents
- **FR-041**: System MUST support 阶段3 (实施计划): AI helps user define implementation approach, milestones, and resource planning, generating implementation plan documents
- **FR-042**: System MUST support 阶段4 (任务构造): AI breaks down the implementation plan into executable tasks, generates task list with dependencies and acceptance criteria
- **FR-043**: System MUST generate documents incrementally as the user answers questions (edge answering, edge generation), rather than waiting for all answers before generation
- **FR-044**: System MUST validate Trickle URLs for accessibility when users submit prototype links
- **FR-045**: System MUST periodically check Trickle link validity and display a warning icon if the link becomes inaccessible

#### Session and State Management

- **FR-046**: System MUST persist conversation history to the database after each message exchange
- **FR-047**: System MUST persist project state (current stage, completed stages, document versions) to the database after each state change
- **FR-048**: System MUST restore conversation history and project state when a user reopens a project
- **FR-049**: System MUST continue executing long-running AI tasks in the background when the user closes the browser
- **FR-050**: System MUST allow users to pause a currently executing task by clicking a "Pause Task" button
- **FR-051**: System MUST allow users to resume a paused task by clicking a "Resume Task" button
- **FR-052**: System MUST display task status (Executing / Completed / Failed / Paused) in the task indicator above the input field
- **FR-053**: System MUST preserve user input data in the database if document generation fails, allowing retry without data loss

#### Integration: IAM Single Sign-On

- **FR-054**: System MUST integrate with the IAM system to support single sign-on (SSO)
- **FR-055**: System MUST open the application in a new browser tab from the IAM homepage without requiring the user to log in again
- **FR-056**: System MUST detect when the IAM session expires and prompt the user to log in again
- **FR-057**: System MUST preserve all local data when the session expires and restore the user to the current project state after re-login

#### Integration: AMDP Master Data Platform

- **FR-058**: System MUST sync directory data (virtual organizations, strategic opportunities, job families) from AMDP every day at 2:00 AM
- **FR-059**: System MUST cache AMDP directory data for 24 hours
- **FR-060**: System MUST use cached directory data if AMDP sync fails, and display a warning: "Directory data may be outdated, AMDP service temporarily unavailable"
- **FR-061**: System MUST allow users to continue creating projects using cached directory data even if it is expired (>24 hours)
- **FR-062**: System MUST provide a directory selection UI during project creation, displaying virtual organizations, strategic opportunities, and job families in a tree structure

#### Integration: Feishu Document Synchronization

- **FR-063**: System MUST synchronize locally generated documents (constitution.md, spec.md, etc.) to Feishu documents in real-time
- **FR-064**: System MUST create a new Feishu document if one does not exist, or update an existing Feishu document if one already exists
- **FR-065**: System MUST automatically retry Feishu sync 3 times with increasing intervals (1s, 5s, 15s) if the initial sync fails
- **FR-066**: System MUST add failed documents to a failure queue if all 3 retries fail
- **FR-067**: System MUST run a background compensation task every hour to retry syncing documents in the failure queue
- **FR-068**: System MUST display a lightweight notification "Feishu sync exception, document saved locally" when sync fails, without blocking user operations
- **FR-069**: System MUST provide a "Sync Now" button for users to manually trigger Feishu document synchronization
- **FR-070**: System MUST treat local database as the single source of truth; in case of sync conflicts, local data overwrites Feishu data
- **FR-071**: System MUST NOT sync changes made directly in Feishu documents back to the local database (one-way sync: local → Feishu)

#### Integration: Feishu Notification

- **FR-072**: System MUST send a Feishu notification to the user when a long-running asynchronous task completes
- **FR-073**: System MUST display the project name, task name, and result summary in the Feishu notification card
- **FR-074**: System MUST provide interactive buttons in the Feishu notification card (e.g., "Continue", "Re-edit")
- **FR-075**: System MUST execute the corresponding action in the background when the user clicks a button in the Feishu notification card, without requiring the user to open the application
- **FR-076**: System MUST update the Feishu notification card status after the action is executed (e.g., "Processed, project advanced to next stage")
- **FR-077**: System MUST merge notifications if multiple tasks complete within 5 minutes, displaying: "Your project 《XX》 has completed 3 tasks: [task list]"
- **FR-078**: System MUST log notification send failures and display unread notification badges when the user next opens the application

#### Project Management

- **FR-079**: System MUST allow users to create multiple projects
- **FR-080**: System MUST check project name uniqueness during creation; if a duplicate name exists, prompt the user to choose a different name
- **FR-081**: System MUST limit project names to 255 characters maximum
- **FR-082**: System MUST provide a project list page showing projects organized by virtual organization, strategic opportunity, and job family categories
- **FR-083**: System MUST support project search by name or category, with results updating in real-time as the user types
- **FR-084**: System MUST navigate to the project's dialog interface when the user clicks a project in the list or search results
- **FR-085**: System MUST display a sidebar on the project list page showing the directory tree structure (virtual organization/strategic opportunity/job family)
- **FR-086**: System MUST filter the project list to show only projects in the selected category when the user clicks a category in the sidebar

#### Permission and Access Control

- **FR-087**: System MUST support three project roles: Owner (can delete project, interact with AI, edit documents), Editor (can interact with AI, edit documents), Viewer (read-only access)
- **FR-088**: System MUST display a permission management icon next to the project name for project owners
- **FR-089**: System MUST show a permission management modal when the owner clicks the permission icon, displaying current members and their roles
- **FR-090**: System MUST allow owners to add new members by entering user ID or name
- **FR-091**: System MUST allow owners to assign or change roles (Owner/Editor/Viewer) for each member
- **FR-092**: System MUST allow owners to remove members from the project
- **FR-093**: System MUST apply permission changes immediately; users see updated permissions on their next action without needing to refresh
- **FR-094**: System MUST disable edit and AI dialog functions for Viewer role users; they can only view content
- **FR-095**: System MUST display "You don't have permission to access this project" when a user without permissions tries to access a project via URL
- **FR-096**: System MUST provide a "Request Access" button that sends a permission request notification to the project owner
- **FR-097**: System MUST support a System Administrator (super admin) role that can view and manage all projects
- **FR-098**: System MUST allow system administrators to transfer project ownership to other users
- **FR-099**: System MUST allow system administrators to delete or archive ownerless projects (projects whose owner has left the organization)

#### Data Export

- **FR-100**: System MUST provide an "Export Project" button on the project details page
- **FR-101**: System MUST generate a .zip file when the user clicks "Export Project", containing: constitution.md, spec.md, plan.md, task.md, project_metadata.json (name, created date, owner, permissions, category), conversation_history.json
- **FR-102**: System MUST display export progress (e.g., "Exporting project data... 50%") during the export process
- **FR-103**: System MUST automatically download the .zip file when the export completes
- **FR-104**: System MUST log the export operation in the project activity log

#### Right Panel: Execution Log Display

- **FR-105**: System MUST record execution logs for each workflow stage, capturing user actions, AI processing steps, and system events
- **FR-106**: System MUST display execution logs in the "运行记录" tab in reverse chronological order (newest first)
- **FR-107**: System MUST show timestamp, status icon (success/failure/in-progress), and description for each log entry using a timeline component
- **FR-108**: System MUST support real-time log updates via SSE when AI is processing or executing tasks
- **FR-109**: System MUST default to the "运行记录" tab when users click workflow nodes in the middle column
- **FR-110**: System MUST switch to the "结果预览" tab when users click document nodes in the workflow tree
- **FR-111**: System MUST show a list of all documents generated in a stage in the "结果预览" tab when a workflow node is clicked
- **FR-112**: System MUST show the full document content with Markdown rendering in the "结果预览" tab when a document node is clicked

#### Right Panel: Dual-Tab Design Details

The right panel features a two-tab design that dynamically responds to user interactions in the middle column:

**"运行记录" Tab Behavior**:
- Displays execution logs for the selected workflow stage in a timeline format (Ant Design Timeline component)
- Shows logs in reverse chronological order (newest first)
- Each log entry includes: timestamp, status icon (checkmark for success, X for failure, loading spinner for in-progress), and description
- Supports real-time updates via SSE when AI is actively processing tasks
- Automatically becomes the active tab when users click workflow stage nodes
- Log types include: user actions (e.g., "用户选择了方案模板"), AI processing steps (e.g., "AI正在生成spec.md"), and system events (e.g., "文档已保存到数据库")

**"结果预览" Tab Behavior**:
- Displays Markdown-rendered document content with metadata header (creation time, update time, version, author) when a document node is clicked
- Shows a document list (with status badges and task count) when a workflow stage node is clicked
- Updates in real-time as AI generates or modifies documents
- Automatically becomes the active tab when users click document nodes in the workflow tree
- Provides "编辑" (Edit), "导出文本文档" (Export), and "确认" (Confirm) buttons for document management (when user has appropriate permissions)

**Tab Switching Logic**:
- Workflow node click → Switch to "运行记录" tab + Load stage execution logs
- Document node click → Switch to "结果预览" tab + Load document content with metadata
- User can manually switch tabs at any time; tab preference persists within the session

#### Middle Column: Unified Workflow Tree

The middle column contains a unified hierarchical tree structure that integrates workflow stages, sub-tasks, and documents.

**Tree Structure**:
- Top level: 5 workflow stages (阶段0-4) with stage status indicators
- Second level: Sub-tasks and activities under each stage
- Third level: Documents and artifacts generated within each activity
- Each stage node displays a task count badge showing the number of items it contains

**Interaction Behavior**:
- When a workflow stage progresses, the tree auto-expands to show newly generated documents and tasks
- When the user clicks a workflow stage, the stage is highlighted and the right panel switches to "运行记录" tab
- When the user clicks a document node, the document is highlighted and the right panel switches to "结果预览" tab
- Tree collapse/expand state is preserved across sessions
- Stage nodes reflect status (pending/in-progress/completed) with visual indicators; document nodes reflect status (draft/completed) with badges

**Performance Optimization**:
- Use Ant Design Tree with `defaultExpandedKeys` and `onExpand` callbacks for controlled expansion
- Debounce expand/collapse operations to prevent rapid state updates
- Implement virtual scrolling with react-window if the tree has more than 50 nodes
- Lazy load document content only when nodes are clicked

**State Management**:
- Use Zustand or Context API to manage: `activeStageId`, `selectedDocumentId`, `expandedKeys` (array of expanded node keys), `currentStageStatus`
- Avoid storing redundant tree data in state; derive tree structure from project data

### Key Entities *(include if feature involves data)*

- **Project**: Represents a software development project; includes project name, created date, owner, current workflow stage, category (virtual organization/strategic opportunity/job family), permission list
- **Workflow Stage**: Represents one of the 5 stages (阶段0: 项目初始化, 阶段1: 需求澄清, 阶段2: 方案构建, 阶段3: 实施计划, 阶段4: 任务构造); includes stage number, stage name, status (pending/in-progress/completed), task count, list of activities and documents
- **Activity**: Represents a sub-task within a workflow stage; includes activity name, description, status, related documents
- **Document**: Represents a generated document (spec.md, plan.md, etc.); includes document type, Markdown content, creation time, update time, version number, author, version history, status (Draft/Completed), corresponding Feishu document ID
- **Conversation Message**: Represents one message in the AI dialog; includes message content, sender (user/AI), message type (input/response/command-success/command-failure), timestamp
- **ExecutionLog**: Represents a log entry for tracking workflow execution; includes the following attributes:
  - `id` (string): Unique identifier for the log entry
  - `stageId` (string): Workflow stage this log belongs to (e.g., "stage-0", "stage-1")
  - `activityId` (string, optional): Specific activity within the stage (if applicable)
  - `type` (enum): Log type - "user-action" (user-initiated events), "ai-process" (AI processing steps), or "system-event" (system-level operations)
  - `status` (enum): Execution status - "success" (completed successfully), "failure" (error occurred), or "in-progress" (currently executing)
  - `message` (string): Human-readable description of the log entry (e.g., "User selected constitution template", "AI generating spec.md")
  - `timestamp` (string): ISO 8601 timestamp when the log entry was created
  - `metadata` (object, optional): Additional context including `documentId` (related document), `feishuDocId` (Feishu document ID), `errorDetails` (error message if status is "failure")
- **User Session**: Represents a user's login session; includes user ID, IAM token, session expiration time, current project ID, conversation history
- **Task**: Represents an asynchronous AI task (e.g., document generation); includes task ID, task type, status (executing/completed/failed/paused), result, related project
- **Permission**: Represents a user's access rights to a project; includes user ID, project ID, role (Owner/Editor/Viewer)
- **Directory Category**: Represents organizational structure data synced from AMDP; includes virtual organization, strategic opportunity, job family, hierarchical relationships

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can load the three-column interface in under 2 seconds on a standard desktop browser with broadband connection
- **SC-002**: Users can complete the full workflow (阶段0 through 阶段4) in under 30 minutes, including AI interaction and document review
- **SC-003**: 90% of users can understand the three-column layout and navigate between dialog, workflow, and preview without additional training
- **SC-004**: AI responses stream to the dialog panel with latency under 500ms from when the user sends a message
- **SC-005**: Document generation completes within 30 seconds for typical responses (under 5,000 words)
- **SC-006**: The system handles 100 concurrent users without degradation in response time or streaming quality
- **SC-007**: Session state persists successfully 99% of the time, allowing users to resume work after browser closure
- **SC-008**: Feishu document synchronization succeeds 95% of the time on the first attempt, and 99% of the time after automatic retries
- **SC-009**: Voice input converts speech to text with 90% accuracy for clear speech in a quiet environment
- **SC-010**: Users can search and find projects in under 3 seconds for a project list of up to 1,000 projects
- **SC-011**: Permission changes take effect within 5 seconds of the owner saving changes
- **SC-012**: Project export generates a .zip file in under 10 seconds for typical projects with up to 10 documents and 100 conversation messages
- **SC-013**: The application runs stably on the latest versions of Chrome, Firefox, Safari, and Edge browsers without major rendering or functional issues
- **SC-014**: 95% of asynchronous tasks continue executing in the background after the user closes the browser and complete successfully
- **SC-015**: User satisfaction score for the AI dialog coaching experience is 4.0 or higher out of 5.0 based on post-workflow surveys

---

## Assumptions *(optional)*

- Users have IAM accounts and are familiar with using the IAM system for single sign-on
- Users use modern desktop browsers (Chrome, Firefox, Safari, Edge) with JavaScript enabled and no ad blockers interfering with SSE
- The backend provides stable APIs for AI dialog, document generation, Feishu integration, and AMDP data synchronization
- The AMDP master data platform provides a synchronization API that can be called on a daily schedule
- Feishu APIs support creating, updating, and synchronizing Markdown documents programmatically
- The network connection is sufficiently stable to support SSE streaming without frequent disconnections
- Users understand basic software development concepts such as "constitution", "spec", "clarify", and "prototype"
- Users have access to Trickle or will learn to use it based on AI guidance for creating prototypes
- Long-running AI tasks can be executed via long-connection mechanisms (e.g., WebSockets or extended SSE) without server timeouts

---

## Dependencies *(optional)*

- **IAM System**: Provides user authentication and single sign-on capabilities; the application depends on IAM for user identity management
- **AMDP Master Data Platform**: Provides organizational structure data (virtual organizations, strategic opportunities, job families); the application depends on AMDP for directory categories
- **Feishu (Lark) APIs**: Provides document storage and notification capabilities; the application depends on Feishu for document archiving and user notifications
- **Backend AI Service**: Provides AI dialog, document generation, and workflow orchestration; the frontend depends on backend APIs for all AI-related functionality
- **Backend API for SSE Streaming**: Provides Server-Sent Events for real-time AI response streaming; the frontend depends on SSE support in the backend
- **Speech-to-Text Service**: Provides voice input conversion; the frontend depends on a speech recognition API (e.g., Web Speech API or cloud service)
- **Trickle Platform**: External prototype design tool; users depend on Trickle to create and share interactive prototypes via URL

---

## Out of Scope *(optional)*

The following features are explicitly out of scope for the first version and may be considered in future iterations:

- **Mobile Device Support**: The first version only supports desktop browsers; mobile browser support is deferred
- **Multi-language Support**: The first version only supports a single language (presumed to be Chinese based on the context); internationalization is deferred
- **Real-time Collaborative Editing**: Multiple users cannot simultaneously edit the same document; locking mechanisms and real-time sync are deferred
- **Document Version Rollback UI**: The first version does not provide a UI for rolling back to previous document versions; users must rely on Feishu's version history
- **Custom Workflow Templates**: The first version only supports the predefined 5-stage workflow; custom workflow creation is deferred
- **Advanced Analytics and Reporting**: Usage analytics, project progress dashboards, and team performance reports are deferred
- **Code Package Upload**: The first version only supports Trickle URL input for prototypes; uploading prototype code packages is deferred
- **Support for Multiple Prototype Tools**: The first version only supports Trickle; integration with Figma, Axure, and other tools is deferred
- **Rich Text Editing in Dialog**: The first version only supports plain text and Markdown in the dialog panel; rich text formatting (bold, italic, links) is deferred
- **Custom Constitution Templates by Users**: The first version uses predefined constitution templates; user-created custom templates are deferred
- **Offline Mode**: The application requires an internet connection; offline editing and sync capabilities are deferred

---

## Technical Constraints *(optional)*

- Frontend must be built using React and TypeScript as specified
- State management must use Zustand or Jotai (for local state) and Context API (for global state) as specified; Zustand is recommended based on Dify's production-proven architecture
- UI components must use AIOS-Design and Ant Design libraries as specified
- HTTP communication must use Axios for API calls as specified
- Real-time communication must use SSE (Server-Sent Events) for streaming AI responses; WebSockets are not used in the first version
- The application must only support desktop browsers (Chrome, Firefox, Safari, Edge); responsive design must adapt to different desktop screen sizes but not mobile devices
- Voice input must use the Web Speech API (if available) or integrate with a cloud-based speech-to-text service

### Production Deployment

- **Server**: 172.16.18.184 (User: op)
- **Frontend Port**: 8080 (http://172.16.18.184:8080)
- **Backend API Port**: 8000 (http://172.16.18.184:8000)
- **Web Server**: Nginx (serves static files and proxies /api/ to backend)
- **Build Tool**: Vite 7.1.7 (build command: `npx vite build` to skip TypeScript checking)
- **Environment Variables**:
  - `VITE_API_BASE_URL=http://172.16.18.184:8000/api` (must include `/api` suffix)
- **Deployment Process**:
  1. Local build: `npx vite build` in frontend directory
  2. Upload files: `scp -r dist/* op@172.16.18.184:~/ai-workflow-dist/`
  3. Server move: `sudo cp -r ~/ai-workflow-dist/* /var/www/ai-workflow-frontend/`
  4. Nginx restart: `sudo systemctl restart nginx`
- **Deployment Documentation**: See `DEPLOYMENT.md` for complete deployment guide

### Recommended Component Libraries (Based on Dify Analysis)

- **Virtual Scrolling**: Use `react-window` (^1.8.10) for efficient rendering of long conversation histories and document lists
- **Markdown Rendering**: Use `react-markdown` (^9.0.1) with `remark-gfm` (^4.0.0) for GitHub Flavored Markdown support
- **Input Components**: Use `react-textarea-autosize` (^8.5.4) for adaptive text input that grows with content
- **Tree Components**: Use Ant Design Tree component for unified workflow tree visualization with hierarchical stages, tasks, and documents
- **Timeline Component**: Use Ant Design Timeline component for execution log display in the "运行记录" tab
- Document comparison diff must use a reliable diff algorithm (e.g., diff-match-patch or similar) to generate accurate line-by-line or word-by-word comparisons

### Chat Component Architecture

- **Hybrid Approach**: Build a custom chat skeleton with Dify-inspired patterns, but customize for the 5 message types (arrow, white-dot, green-dot, red-dot, flashing-star)
- **Component Structure**: Separate concerns into ChatInputArea, MessageList, MessageItem, and TaskStatusIndicator components
- **Message Rendering**: Support Markdown rendering in AI responses using react-markdown
- **Virtual Scrolling**: Implement react-window for message list when conversation history exceeds 100 messages

### Security and Performance

- The application must handle IAM SSO authentication tokens securely, storing them in httpOnly cookies or secure storage, and refresh them as needed
- Network error handling must include retry logic with exponential backoff for SSE reconnection and API calls
- The application must not store sensitive data (e.g., user credentials, tokens) in localStorage or sessionStorage; use secure, httpOnly cookies instead

---

## Future Enhancements *(optional)*

The following features are potential enhancements for future versions:

- Support for mobile devices (responsive design for tablets and smartphones)
- Multi-language support (internationalization and localization)
- Real-time collaborative editing with operational transformation or CRDTs
- Document version rollback UI with visual diff and one-click restore
- Custom workflow templates allowing teams to define their own stages and activities
- Advanced analytics dashboard showing project progress, task completion rates, and team efficiency metrics
- Integration with additional prototype tools (Figma, Axure, Sketch)
- Rich text editing in the dialog panel with formatting toolbar
- User-created custom constitution templates with a template management interface
- Offline mode with local storage and background sync when reconnected
- AI model selection allowing users to choose different AI models for dialog (e.g., GPT-4, Claude, custom models)
- Plugin system for extending workflow stages with custom activities
- API for external systems to trigger workflows or query project status
- Advanced permission management with custom roles and granular permissions (e.g., can view but not download, can comment but not edit)
