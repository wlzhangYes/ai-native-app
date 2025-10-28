// MSW Request Handlers
// Based on contracts/openapi.yaml

import { http, HttpResponse, delay } from 'msw';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import { mockProjects } from './data/projects';
import { mockWorkflows } from './data/workflows';
import { mockConversations } from './data/conversations';
import { getDocumentsByProjectId } from './data/documents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ============================================================================
// Mock Handlers
// ============================================================================

export const handlers = [
  // ============================================================================
  // Auth Endpoints
  // ============================================================================

  http.get(`${API_BASE}/auth/me`, async () => {
    await delay(200); // Simulate network delay

    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-001',
        name: '张伟',
        email: 'zhangwei@example.com',
        avatar: 'https://i.pravatar.cc/150?img=1',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }),

  // ============================================================================
  // Projects Endpoints
  // ============================================================================

  http.get(`${API_BASE}/projects`, async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: {
        items: mockProjects,
        total: mockProjects.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }),

  // ============================================================================
  // Dialog Endpoints
  // ============================================================================

  http.get(`${API_BASE}/projects/:projectId/dialog/messages`, async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }),

  http.post(`${API_BASE}/projects/:projectId/dialog/messages`, async () => {
    await delay(100);

    return HttpResponse.json({
      success: true,
      data: {
        messageId: 'msg-' + Date.now(),
        streamUrl: `${API_BASE}/projects/proj-001/dialog/stream`,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }),

  // ============================================================================
  // Workflow Endpoints
  // ============================================================================

  http.get(`${API_BASE}/projects/:projectId/workflow`, async ({ params }) => {
    await delay(200);

    const { projectId } = params;
    const workflow = mockWorkflows.find((w) => w.projectId === projectId);

    if (!workflow) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Workflow not found' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }),

  // ============================================================================
  // SSE Endpoint - Stream AI Responses
  // ============================================================================

  http.get(`${API_BASE}/projects/:projectId/dialog/stream`, async ({ params }) => {
    const { projectId } = params;

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Helper to send SSE event
        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Simulate AI streaming response
          await delay(500);

          // Send message chunks
          const messageChunks = [
            '好的，',
            '我明白了。',
            '让我帮你',
            '生成',
            '这个功能的',
            '规格说明...'
          ];

          for (const chunk of messageChunks) {
            sendEvent('message', {
              delta: chunk,
              accumulated: messageChunks.slice(0, messageChunks.indexOf(chunk) + 1).join(''),
              messageId: 'msg-ai-' + Date.now(),
            });
            await delay(200);
          }

          // Send status update
          sendEvent('status', {
            taskName: '生成 spec.md',
            status: 'in_progress',
            progress: 50,
          });

          await delay(1000);

          // Send document update
          sendEvent('document_update', {
            documentId: 'doc-003',
            name: 'spec.md',
            action: 'updated',
            content: '# 功能规格说明\n\n## 概述\n...',
            version: 4,
          });

          // Send workflow update
          sendEvent('workflow_update', {
            workflowId: 'workflow-001',
            stageId: 'stage-2-001',
            action: 'task_updated',
            data: {
              taskId: 'task-003',
              status: 'completed',
            },
          });

          // Send completion event
          sendEvent('complete', {
            messageId: 'msg-ai-' + Date.now(),
            totalDuration: 3000,
          });

          // Close the stream
          controller.close();
        } catch (error) {
          sendEvent('error', {
            code: 'STREAM_ERROR',
            message: 'Failed to stream AI response',
            recoverable: false,
          });
          controller.close();
        }
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }),

  // ============================================================================
  // Documents Endpoints
  // ============================================================================

  http.get(`${API_BASE}/projects/:projectId/documents`, async ({ params }) => {
    await delay(300);

    const { projectId } = params;
    const documents = getDocumentsByProjectId(projectId as string);

    return HttpResponse.json({
      success: true,
      data: documents,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }),
];
