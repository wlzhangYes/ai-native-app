// IndexedDB Persistence Utility
// Provides structured storage for workflow state, documents, and session data
// Based on spec.md FR-046 to FR-053: Session persistence requirements

const DB_NAME = 'ai-workflow-db';
const DB_VERSION = 1;

// Object store names
export const STORES = {
  WORKFLOW: 'workflow',
  DOCUMENTS: 'documents',
  SESSION: 'session',
  TASKS: 'tasks',
} as const;

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Initialize IndexedDB with required object stores
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Workflow object store (stores current workflow state)
      if (!db.objectStoreNames.contains(STORES.WORKFLOW)) {
        const workflowStore = db.createObjectStore(STORES.WORKFLOW, { keyPath: 'projectId' });
        workflowStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Documents object store (stores all documents)
      if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
        const documentsStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        documentsStore.createIndex('projectId', 'projectId', { unique: false });
        documentsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Session object store (stores session metadata)
      if (!db.objectStoreNames.contains(STORES.SESSION)) {
        const sessionStore = db.createObjectStore(STORES.SESSION, { keyPath: 'key' });
        sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Tasks object store (stores background task status)
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'taskId' });
        tasksStore.createIndex('projectId', 'projectId', { unique: false });
        tasksStore.createIndex('status', 'status', { unique: false });
        tasksStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// ============================================================================
// Generic CRUD Operations
// ============================================================================

/**
 * Save data to a specific object store
 */
export async function save<T>(
  storeName: string,
  data: T & { updatedAt?: string; timestamp?: string }
): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  // Add timestamp metadata
  const dataWithTimestamp = {
    ...data,
    updatedAt: data.updatedAt || new Date().toISOString(),
    timestamp: data.timestamp || new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(dataWithTimestamp);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save to ${storeName}`));
  });
}

/**
 * Get data from a specific object store by key
 */
export async function get<T>(storeName: string, key: string | number): Promise<T | null> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
  });
}

/**
 * Get all data from a specific object store
 */
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
  });
}

/**
 * Get data by index
 */
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  indexValue: string | number
): Promise<T[]> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const index = store.index(indexName);

  return new Promise((resolve, reject) => {
    const request = index.getAll(indexValue);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to get by index from ${storeName}`));
  });
}

/**
 * Delete data from a specific object store by key
 */
export async function remove(storeName: string, key: string | number): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
  });
}

/**
 * Clear all data from a specific object store
 */
export async function clear(storeName: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
  });
}

// ============================================================================
// Workflow-specific Operations
// ============================================================================

export interface PersistedWorkflowState {
  projectId: string;
  workflow: any; // Workflow type
  activeStageId: string | null;
  selectedDocumentId: string | null;
  expandedKeys: string[];
  selectedKeys: string[];
  updatedAt: string;
}

/**
 * Save workflow state to IndexedDB
 */
export async function saveWorkflowState(state: PersistedWorkflowState): Promise<void> {
  return save(STORES.WORKFLOW, state);
}

/**
 * Get workflow state from IndexedDB
 */
export async function getWorkflowState(projectId: string): Promise<PersistedWorkflowState | null> {
  return get<PersistedWorkflowState>(STORES.WORKFLOW, projectId);
}

/**
 * Delete workflow state from IndexedDB
 */
export async function deleteWorkflowState(projectId: string): Promise<void> {
  return remove(STORES.WORKFLOW, projectId);
}

// ============================================================================
// Document-specific Operations
// ============================================================================

/**
 * Save multiple documents to IndexedDB
 */
export async function saveDocuments(documents: any[]): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(STORES.DOCUMENTS, 'readwrite');
  const store = transaction.objectStore(STORES.DOCUMENTS);

  return new Promise((resolve, reject) => {
    documents.forEach((doc) => {
      const docWithTimestamp = {
        ...doc,
        updatedAt: doc.updatedAt || new Date().toISOString(),
      };
      store.put(docWithTimestamp);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to save documents'));
  });
}

/**
 * Get documents by project ID
 */
export async function getDocumentsByProject(projectId: string): Promise<any[]> {
  return getByIndex(STORES.DOCUMENTS, 'projectId', projectId);
}

/**
 * Delete all documents for a project
 */
export async function deleteDocumentsByProject(projectId: string): Promise<void> {
  const documents = await getDocumentsByProject(projectId);
  const db = await initDB();
  const transaction = db.transaction(STORES.DOCUMENTS, 'readwrite');
  const store = transaction.objectStore(STORES.DOCUMENTS);

  return new Promise((resolve, reject) => {
    documents.forEach((doc) => {
      store.delete(doc.id);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to delete documents'));
  });
}

// ============================================================================
// Task-specific Operations
// ============================================================================

export interface PersistedTask {
  taskId: string;
  projectId: string;
  taskName: string;
  status: 'idle' | 'executing' | 'paused' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save task status to IndexedDB
 */
export async function saveTask(task: PersistedTask): Promise<void> {
  return save(STORES.TASKS, task);
}

/**
 * Get task by task ID
 */
export async function getTask(taskId: string): Promise<PersistedTask | null> {
  return get<PersistedTask>(STORES.TASKS, taskId);
}

/**
 * Get all tasks for a project
 */
export async function getTasksByProject(projectId: string): Promise<PersistedTask[]> {
  return getByIndex<PersistedTask>(STORES.TASKS, 'projectId', projectId);
}

/**
 * Get all tasks by status
 */
export async function getTasksByStatus(
  status: 'idle' | 'executing' | 'paused' | 'completed' | 'failed'
): Promise<PersistedTask[]> {
  return getByIndex<PersistedTask>(STORES.TASKS, 'status', status);
}

/**
 * Delete task from IndexedDB
 */
export async function deleteTask(taskId: string): Promise<void> {
  return remove(STORES.TASKS, taskId);
}

// ============================================================================
// Session Management
// ============================================================================

export interface SessionMetadata {
  key: string;
  currentProjectId: string | null;
  lastActiveAt: string;
  timestamp: string;
}

/**
 * Save session metadata
 */
export async function saveSession(session: SessionMetadata): Promise<void> {
  return save(STORES.SESSION, session);
}

/**
 * Get session metadata
 */
export async function getSession(key: string): Promise<SessionMetadata | null> {
  return get<SessionMetadata>(STORES.SESSION, key);
}

/**
 * Get current session (using 'current' as key)
 */
export async function getCurrentSession(): Promise<SessionMetadata | null> {
  return getSession('current');
}

/**
 * Clear session metadata
 */
export async function clearSession(key: string): Promise<void> {
  return remove(STORES.SESSION, key);
}

// ============================================================================
// Database Cleanup
// ============================================================================

/**
 * Clear all data from IndexedDB (use with caution)
 */
export async function clearAllData(): Promise<void> {
  await clear(STORES.WORKFLOW);
  await clear(STORES.DOCUMENTS);
  await clear(STORES.SESSION);
  await clear(STORES.TASKS);
}
