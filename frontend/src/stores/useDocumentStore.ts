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
  documents: Map<string, Document>; // documentId -> Document
  editingDocumentId: string | null;
  isDiffMode: boolean;
  diffComparisonVersion: number | null; // Version to compare against
  previousDocumentContent: string | null; // For comparison in diff mode

  // Actions
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

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    persist(
      immer((set) => ({
      // Initial state
      documents: new Map(),
      editingDocumentId: null,
      isDiffMode: false,
      diffComparisonVersion: null,
      previousDocumentContent: null,

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
          documents: state.documents,
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
