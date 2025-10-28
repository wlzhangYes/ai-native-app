// Document API Service
// Based on contracts/openapi.yaml

import { get, post, put, del } from './request';
import type {
  ApiResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentVersionQuery,
  ExportDocumentQuery,
  SyncFeishuRequest,
  SyncFeishuResponse,
} from '@/types/api';
import type { Document } from '@/types/models';

/**
 * Get all documents for a project
 */
export async function getDocuments(projectId: string): Promise<ApiResponse<Document[]>> {
  return get<Document[]>(`/projects/${projectId}/documents`);
}

/**
 * Create a new document
 */
export async function createDocument(projectId: string, data: CreateDocumentRequest): Promise<ApiResponse<Document>> {
  return post<Document>(`/projects/${projectId}/documents`, data);
}

/**
 * Get document by ID
 */
export async function getDocument(
  projectId: string,
  documentId: string,
  query?: DocumentVersionQuery
): Promise<ApiResponse<Document>> {
  return get<Document>(`/projects/${projectId}/documents/${documentId}`, { params: query });
}

/**
 * Update document content
 */
export async function updateDocument(
  projectId: string,
  documentId: string,
  data: UpdateDocumentRequest
): Promise<ApiResponse<Document>> {
  return put<Document>(`/projects/${projectId}/documents/${documentId}`, data);
}

/**
 * Delete a document
 */
export async function deleteDocument(projectId: string, documentId: string): Promise<ApiResponse<void>> {
  return del<void>(`/projects/${projectId}/documents/${documentId}`);
}

/**
 * Export document in specified format
 */
export async function exportDocument(
  projectId: string,
  documentId: string,
  query: ExportDocumentQuery
): Promise<ApiResponse<Blob>> {
  return get<Blob>(`/projects/${projectId}/documents/${documentId}/export`, {
    params: query,
    responseType: 'blob',
  });
}

/**
 * Sync document to Feishu
 */
export async function syncToFeishu(
  projectId: string,
  documentId: string,
  data?: SyncFeishuRequest
): Promise<ApiResponse<SyncFeishuResponse>> {
  return post<SyncFeishuResponse>(
    `/projects/${projectId}/documents/${documentId}/feishu/sync`,
    data || { documentId }
  );
}
