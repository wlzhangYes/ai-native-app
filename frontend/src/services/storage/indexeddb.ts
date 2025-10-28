// IndexedDB Storage Wrapper using idb
// Based on research.md storage decisions

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Project, Conversation, Document } from '@/types/models';

// ============================================================================
// Database Schema
// ============================================================================

interface WorkflowDB extends DBSchema {
  projects: {
    key: string; // project ID
    value: Project;
    indexes: {
      'by-status': string;
      'by-updated': string;
    };
  };
  conversations: {
    key: string; // conversation ID
    value: Conversation;
    indexes: {
      'by-project': string;
      'by-stage': string;
      'by-updated': string;
    };
  };
  documents: {
    key: string; // document ID
    value: Document;
    indexes: {
      'by-project': string;
      'by-stage': string;
      'by-name': string;
    };
  };
}

const DB_NAME = 'workflow-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<WorkflowDB> | null = null;

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Open and initialize IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<WorkflowDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<WorkflowDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-status', 'status');
        projectStore.createIndex('by-updated', 'updatedAt');
      }

      // Conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
        conversationStore.createIndex('by-project', 'projectId');
        conversationStore.createIndex('by-stage', 'stageId');
        conversationStore.createIndex('by-updated', 'updatedAt');
      }

      // Documents store
      if (!db.objectStoreNames.contains('documents')) {
        const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
        documentStore.createIndex('by-project', 'projectId');
        documentStore.createIndex('by-stage', 'stageId');
        documentStore.createIndex('by-name', 'name');
      }
    },
  });

  return dbInstance;
}

// ============================================================================
// Project Operations
// ============================================================================

export async function saveProject(project: Project): Promise<void> {
  const db = await initDB();
  await db.put('projects', project);
}

export async function getProject(projectId: string): Promise<Project | undefined> {
  const db = await initDB();
  return db.get('projects', projectId);
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await initDB();
  return db.getAll('projects');
}

export async function getProjectsByStatus(status: string): Promise<Project[]> {
  const db = await initDB();
  return db.getAllFromIndex('projects', 'by-status', status);
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await initDB();
  await db.delete('projects', projectId);
}

// ============================================================================
// Conversation Operations
// ============================================================================

export async function saveConversation(conversation: Conversation): Promise<void> {
  const db = await initDB();
  await db.put('conversations', conversation);
}

export async function getConversation(conversationId: string): Promise<Conversation | undefined> {
  const db = await initDB();
  return db.get('conversations', conversationId);
}

export async function getConversationsByProject(projectId: string): Promise<Conversation[]> {
  const db = await initDB();
  return db.getAllFromIndex('conversations', 'by-project', projectId);
}

export async function getConversationsByStage(stageId: string): Promise<Conversation[]> {
  const db = await initDB();
  return db.getAllFromIndex('conversations', 'by-stage', stageId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const db = await initDB();
  await db.delete('conversations', conversationId);
}

// ============================================================================
// Document Operations
// ============================================================================

export async function saveDocument(document: Document): Promise<void> {
  const db = await initDB();
  await db.put('documents', document);
}

export async function getDocument(documentId: string): Promise<Document | undefined> {
  const db = await initDB();
  return db.get('documents', documentId);
}

export async function getDocumentsByProject(projectId: string): Promise<Document[]> {
  const db = await initDB();
  return db.getAllFromIndex('documents', 'by-project', projectId);
}

export async function getDocumentsByStage(stageId: string): Promise<Document[]> {
  const db = await initDB();
  return db.getAllFromIndex('documents', 'by-stage', stageId);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const db = await initDB();
  await db.delete('documents', documentId);
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Clear all data from a specific store
 */
export async function clearStore(storeName: 'projects' | 'conversations' | 'documents'): Promise<void> {
  const db = await initDB();
  await db.clear(storeName);
}

/**
 * Clear all data from all stores
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await Promise.all([db.clear('projects'), db.clear('conversations'), db.clear('documents')]);
}

/**
 * Get database size estimate (in bytes)
 */
export async function getDatabaseSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage ?? 0;
  }
  return 0;
}
