// Document Store - Manages document state, editing, and diff mode
// Based on data-model.md Zustand store design

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { Document } from '@/types/models';

// Enable Map/Set support in Immer
enableMapSet();

// ============================================================================
// Store State Interface
// ============================================================================

interface DocumentStore {
  // State
  currentSessionId: string | null; // 当前会话ID，用于隔离数据
  documents: Map<string, Document>; // documentId -> Document
  editingDocumentId: string | null;
  isDiffMode: boolean;
  diffComparisonVersion: number | null; // Version to compare against
  previousDocumentContent: string | null; // For comparison in diff mode

  // Actions
  setCurrentSession: (sessionId: string) => void; // 切换会话并加载对应数据
  saveSessionData: () => void; // 保存当前会话数据到 localStorage
  loadSessionData: (sessionId: string) => void; // 从 localStorage 加载会话数据
  setDocument: (document: Document) => void;
  setDocuments: (documents: Document[]) => void;
  updateDocument: (documentId: string, updates: Partial<Document>) => void;
  removeDocument: (documentId: string) => void;
  startEditing: (documentId: string) => void;
  stopEditing: () => void;
  enterDiffMode: (documentId: string, comparisonVersion?: number) => void;
  exitDiffMode: () => void;
  savePreviousContent: (content: string) => void;
  clearDocuments: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

// Helper functions for session-based localStorage
const getDocumentStorageKey = (sessionId: string) => `document-session-${sessionId}`;

const saveDocumentsToStorage = (sessionId: string, data: {
  documents: Map<string, Document>;
}) => {
  try {
    const key = getDocumentStorageKey(sessionId);
    // Convert Map to Array for JSON serialization
    const documentsArray = Array.from(data.documents.entries());
    localStorage.setItem(key, JSON.stringify({ documents: documentsArray }));
    console.log(`[DocumentStore] Saved session data to ${key}`);
  } catch (error) {
    console.error('[DocumentStore] Failed to save session data:', error);
  }
};

const loadDocumentsFromStorage = (sessionId: string): { documents: Map<string, Document> } | null => {
  try {
    const key = getDocumentStorageKey(sessionId);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      // Convert Array back to Map
      const documentsMap = new Map(parsed.documents || []);
      console.log(`[DocumentStore] Loaded session data from ${key}`);
      return { documents: documentsMap };
    }
  } catch (error) {
    console.error('[DocumentStore] Failed to load session data:', error);
  }
  return null;
};

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      currentSessionId: null,
      documents: new Map(),
      editingDocumentId: null,
      isDiffMode: false,
      diffComparisonVersion: null,
      previousDocumentContent: null,

      // 设置当前会话并加载对应数据
      setCurrentSession: (sessionId) =>
        set((state) => {
          console.log(`[DocumentStore] Switching to session: ${sessionId}`);

          // 保存当前会话数据（如果有）
          if (state.currentSessionId) {
            saveDocumentsToStorage(state.currentSessionId, {
              documents: state.documents,
            });
          }

          // 加载新会话数据
          const sessionData = loadDocumentsFromStorage(sessionId);
          state.currentSessionId = sessionId;
          state.documents = sessionData?.documents || new Map();
          // Reset editing and diff states when switching sessions
          state.editingDocumentId = null;
          state.isDiffMode = false;
          state.diffComparisonVersion = null;
          state.previousDocumentContent = null;
        }),

      // 保存当前会话数据
      saveSessionData: () => {
        const state = get();
        if (state.currentSessionId) {
          saveDocumentsToStorage(state.currentSessionId, {
            documents: state.documents,
          });
        }
      },

      // 加载会话数据
      loadSessionData: (sessionId) =>
        set((state) => {
          const sessionData = loadDocumentsFromStorage(sessionId);
          if (sessionData) {
            state.documents = sessionData.documents;
          }
        }),

      // Set a single document
      setDocument: (document) =>
        set((state) => {
          state.documents.set(document.id, document);
        }),

      // Set multiple documents
      setDocuments: (documents) =>
        set((state) => {
          state.documents = new Map(documents.map((doc) => [doc.id, doc]));
        }),

      // Update a document's properties
      updateDocument: (documentId, updates) =>
        set((state) => {
          const document = state.documents.get(documentId);
          if (document) {
            state.documents.set(documentId, {
              ...document,
              ...updates,
              updatedAt: new Date().toISOString(),
            });
          }
        }),

      // Remove a document
      removeDocument: (documentId) =>
        set((state) => {
          state.documents.delete(documentId);
          if (state.editingDocumentId === documentId) {
            state.editingDocumentId = null;
          }
        }),

      // Start editing a document
      startEditing: (documentId) =>
        set((state) => {
          const document = state.documents.get(documentId);
          if (document) {
            state.editingDocumentId = documentId;
            // Save current content for potential diff comparison
            state.previousDocumentContent = document.content;
          }
        }),

      // Stop editing
      stopEditing: () =>
        set((state) => {
          state.editingDocumentId = null;
          state.previousDocumentContent = null;
        }),

      // Enter diff mode to compare document versions
      enterDiffMode: (documentId, comparisonVersion) =>
        set((state) => {
          const document = state.documents.get(documentId);
          if (document) {
            state.isDiffMode = true;
            state.diffComparisonVersion = comparisonVersion ?? document.version - 1;
            // Save current content for comparison
            if (!state.previousDocumentContent) {
              state.previousDocumentContent = document.content;
            }
          }
        }),

      // Exit diff mode
      exitDiffMode: () =>
        set((state) => {
          state.isDiffMode = false;
          state.diffComparisonVersion = null;
        }),

      // Save previous content for comparison
      savePreviousContent: (content) =>
        set((state) => {
          state.previousDocumentContent = content;
        }),

      // Clear all documents
      clearDocuments: () =>
        set((state) => {
          state.documents = new Map();
          state.editingDocumentId = null;
          state.isDiffMode = false;
          state.diffComparisonVersion = null;
          state.previousDocumentContent = null;
        }),
      })),
      {
        name: 'document-store',
        storage: createJSONStorage(() => localStorage, {
          // Custom serializer to handle Map
          reviver: (key, value) => {
            if (key === 'documents' && Array.isArray(value)) {
              return new Map(value);
            }
            return value;
          },
          replacer: (key, value) => {
            if (key === 'documents' && value instanceof Map) {
              return Array.from(value.entries());
            }
            return value;
          },
        }),
        partialize: (state) => ({
          // Don't persist session data - managed by session-based localStorage
          // Don't persist editing state, diff mode, or temporary content
        }),
      }
    ),
    { name: 'DocumentStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectDocument = (documentId: string) => (state: DocumentStore) => state.documents.get(documentId);

export const selectAllDocuments = (state: DocumentStore) => Array.from(state.documents.values());

export const selectEditingDocument = (state: DocumentStore) =>
  state.editingDocumentId ? state.documents.get(state.editingDocumentId) : null;

export const selectIsDiffMode = (state: DocumentStore) => state.isDiffMode;

export const selectPreviousContent = (state: DocumentStore) => state.previousDocumentContent;

export const selectDocumentsByProject = (projectId: string) => (state: DocumentStore) =>
  Array.from(state.documents.values()).filter((doc) => doc.projectId === projectId);
