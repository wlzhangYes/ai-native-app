// Integration tests for session switching and data isolation
// Tests that data is properly isolated between different sessions/projects

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useUIActionStore } from '@/stores/useUIActionStore';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Document } from '@/types/models';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Session Switching Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('should isolate document data between sessions', async () => {
    const session1 = 'project-1';
    const session2 = 'project-2';

    // Create test documents for different sessions
    const doc1: Document = {
      id: 'doc1',
      title: 'Document 1',
      content: 'Content for project 1',
      type: 'markdown',
      projectId: session1,
      version: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    const doc2: Document = {
      id: 'doc2',
      title: 'Document 2',
      content: 'Content for project 2',
      type: 'markdown',
      projectId: session2,
      version: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    // Test session 1
    const { result: docStore1 } = renderHook(() => useDocumentStore());

    act(() => {
      docStore1.current.setCurrentSession(session1);
      docStore1.current.setDocument(doc1);
    });

    expect(docStore1.current.documents.get('doc1')).toEqual(doc1);
    expect(docStore1.current.documents.size).toBe(1);

    // Switch to session 2
    act(() => {
      docStore1.current.setCurrentSession(session2);
      docStore1.current.setDocument(doc2);
    });

    expect(docStore1.current.documents.get('doc2')).toEqual(doc2);
    expect(docStore1.current.documents.get('doc1')).toBeUndefined();
    expect(docStore1.current.documents.size).toBe(1);

    // Switch back to session 1 - should restore doc1
    act(() => {
      docStore1.current.setCurrentSession(session1);
    });

    expect(docStore1.current.documents.get('doc1')).toEqual(doc1);
    expect(docStore1.current.documents.get('doc2')).toBeUndefined();
    expect(docStore1.current.documents.size).toBe(1);

    // Verify localStorage was called with correct keys
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'document-session-project-1',
      expect.stringContaining('doc1')
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'document-session-project-2',
      expect.stringContaining('doc2')
    );
  });

  it('should isolate UI actions between sessions', async () => {
    const session1 = 'project-1';
    const session2 = 'project-2';

    const { result: uiStore } = renderHook(() => useUIActionStore());

    // Add action to session 1
    act(() => {
      uiStore.current.setCurrentSession(session1);
    });

    let actionId1: string;
    act(() => {
      actionId1 = uiStore.current.addAction('select-template', { templateId: 'template1' });
    });

    expect(uiStore.current.pendingActions).toHaveLength(1);
    expect(uiStore.current.pendingActions[0].payload.templateId).toBe('template1');

    // Switch to session 2
    act(() => {
      uiStore.current.setCurrentSession(session2);
    });

    // Session 2 should be empty
    expect(uiStore.current.pendingActions).toHaveLength(0);

    // Add different action to session 2
    let actionId2: string;
    act(() => {
      actionId2 = uiStore.current.addAction('fill-form', { formData: { name: 'test' } });
    });

    expect(uiStore.current.pendingActions).toHaveLength(1);
    expect(uiStore.current.pendingActions[0].payload.formData.name).toBe('test');

    // Switch back to session 1
    act(() => {
      uiStore.current.setCurrentSession(session1);
    });

    // Should restore session 1 actions
    expect(uiStore.current.pendingActions).toHaveLength(1);
    expect(uiStore.current.pendingActions[0].payload.templateId).toBe('template1');

    // Verify localStorage isolation
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'ui-action-session-project-1',
      expect.stringContaining('template1')
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'ui-action-session-project-2',
      expect.stringContaining('test')
    );
  });

  it('should coordinate session switching across all stores', async () => {
    const session1 = 'project-1';
    const session2 = 'project-2';

    const { result: projectStore } = renderHook(() => useProjectStore());
    const { result: docStore } = renderHook(() => useDocumentStore());
    const { result: uiStore } = renderHook(() => useUIActionStore());

    // Set up data in session 1
    act(() => {
      projectStore.current.setCurrentProjectId(session1);
      docStore.current.setCurrentSession(session1);
      uiStore.current.setCurrentSession(session1);
    });

    const doc: Document = {
      id: 'doc1',
      title: 'Test Doc',
      content: 'Test content',
      type: 'markdown',
      projectId: session1,
      version: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    act(() => {
      docStore.current.setDocument(doc);
      uiStore.current.addAction('select-template', { templateId: 'template1' });
    });

    // Verify session 1 has data
    expect(projectStore.current.currentProjectId).toBe(session1);
    expect(docStore.current.currentSessionId).toBe(session1);
    expect(docStore.current.documents.size).toBe(1);
    expect(uiStore.current.currentSessionId).toBe(session1);
    expect(uiStore.current.pendingActions).toHaveLength(1);

    // Switch all stores to session 2
    act(() => {
      projectStore.current.setCurrentProjectId(session2);
      docStore.current.setCurrentSession(session2);
      uiStore.current.setCurrentSession(session2);
    });

    // Verify session 2 is clean
    expect(projectStore.current.currentProjectId).toBe(session2);
    expect(docStore.current.currentSessionId).toBe(session2);
    expect(docStore.current.documents.size).toBe(0);
    expect(uiStore.current.currentSessionId).toBe(session2);
    expect(uiStore.current.pendingActions).toHaveLength(0);

    // Switch back to session 1
    act(() => {
      projectStore.current.setCurrentProjectId(session1);
      docStore.current.setCurrentSession(session1);
      uiStore.current.setCurrentSession(session1);
    });

    // Verify session 1 data is restored
    expect(projectStore.current.currentProjectId).toBe(session1);
    expect(docStore.current.currentSessionId).toBe(session1);
    expect(docStore.current.documents.size).toBe(1);
    expect(docStore.current.documents.get('doc1')).toEqual(doc);
    expect(uiStore.current.currentSessionId).toBe(session1);
    expect(uiStore.current.pendingActions).toHaveLength(1);
    expect(uiStore.current.pendingActions[0].payload.templateId).toBe('template1');
  });

  it('should handle concurrent session operations', async () => {
    const session1 = 'project-1';
    const session2 = 'project-2';

    const { result: docStore } = renderHook(() => useDocumentStore());

    // Create multiple documents rapidly
    act(() => {
      docStore.current.setCurrentSession(session1);

      // Add multiple documents to session 1
      for (let i = 1; i <= 5; i++) {
        const doc: Document = {
          id: `doc${i}`,
          title: `Document ${i}`,
          content: `Content ${i}`,
          type: 'markdown',
          projectId: session1,
          version: 1,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        };
        docStore.current.setDocument(doc);
      }
    });

    expect(docStore.current.documents.size).toBe(5);

    // Rapid session switching
    act(() => {
      docStore.current.setCurrentSession(session2);
      docStore.current.setCurrentSession(session1);
      docStore.current.setCurrentSession(session2);
      docStore.current.setCurrentSession(session1);
    });

    // Should maintain data integrity
    expect(docStore.current.documents.size).toBe(5);
    expect(docStore.current.documents.get('doc1')).toBeDefined();
    expect(docStore.current.documents.get('doc5')).toBeDefined();
  });

  it('should clean up editing state on session switch', async () => {
    const session1 = 'project-1';
    const session2 = 'project-2';

    const { result: docStore } = renderHook(() => useDocumentStore());

    const doc: Document = {
      id: 'doc1',
      title: 'Test Doc',
      content: 'Original content',
      type: 'markdown',
      projectId: session1,
      version: 1,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    act(() => {
      docStore.current.setCurrentSession(session1);
      docStore.current.setDocument(doc);
      docStore.current.startEditing('doc1');
      docStore.current.enterDiffMode('doc1');
    });

    // Verify editing and diff mode are active
    expect(docStore.current.editingDocumentId).toBe('doc1');
    expect(docStore.current.isDiffMode).toBe(true);
    expect(docStore.current.previousDocumentContent).toBe('Original content');

    // Switch session
    act(() => {
      docStore.current.setCurrentSession(session2);
    });

    // Editing state should be cleared
    expect(docStore.current.editingDocumentId).toBe(null);
    expect(docStore.current.isDiffMode).toBe(false);
    expect(docStore.current.previousDocumentContent).toBe(null);

    // Switch back - editing state should remain cleared
    act(() => {
      docStore.current.setCurrentSession(session1);
    });

    expect(docStore.current.editingDocumentId).toBe(null);
    expect(docStore.current.isDiffMode).toBe(false);
    expect(docStore.current.previousDocumentContent).toBe(null);
    // But document data should be preserved
    expect(docStore.current.documents.get('doc1')).toEqual(doc);
  });
});