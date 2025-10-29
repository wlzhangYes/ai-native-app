import { useCallback } from 'react';
import { useDocumentStore } from '../../../stores/useDocumentStore';
import type { Document } from '../../../types/models';

/**
 * useDocuments Hook - 文档管理
 *
 * 封装文档的 CRUD 操作
 * 依赖：useDocumentStore (Zustand)
 *
 * @returns 文档相关操作和数据
 *
 * @example
 * ```tsx
 * const { documents, addDocument, updateDocument } = useDocuments();
 *
 * addDocument({
 *   id: 'doc-1',
 *   name: 'spec.md',
 *   content: '# Specification\n...'
 * });
 * ```
 */
export function useDocuments() {
  const documents = useDocumentStore((state) => state.documents);
  const selectedDocument = useDocumentStore((state) => state.selectedDocument);
  const setDocuments = useDocumentStore((state) => state.setDocuments);
  const addDocument = useDocumentStore((state) => state.addDocument);
  const updateDocument = useDocumentStore((state) => state.updateDocument);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
  const selectDocument = useDocumentStore((state) => state.selectDocument);

  // 按 ID 获取文档
  const getDocumentById = useCallback(
    (id: string): Document | undefined => {
      return documents.find((doc) => doc.id === id);
    },
    [documents]
  );

  // 按类型过滤文档
  const getDocumentsByType = useCallback(
    (type: string): Document[] => {
      return documents.filter((doc) => doc.type === type);
    },
    [documents]
  );

  // 搜索文档（按名称或内容）
  const searchDocuments = useCallback(
    (query: string): Document[] => {
      const lowerQuery = query.toLowerCase();
      return documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(lowerQuery) ||
          doc.content?.toLowerCase().includes(lowerQuery)
      );
    },
    [documents]
  );

  // 获取最近修改的文档
  const getRecentDocuments = useCallback(
    (limit = 5): Document[] => {
      return [...documents]
        .filter((doc) => doc.updatedAt)
        .sort((a, b) => {
          const timeA = a.updatedAt || 0;
          const timeB = b.updatedAt || 0;
          return timeB - timeA;
        })
        .slice(0, limit);
    },
    [documents]
  );

  // 批量更新文档
  const updateMultipleDocuments = useCallback(
    (updates: Array<{ id: string; data: Partial<Document> }>) => {
      updates.forEach(({ id, data }) => {
        updateDocument(id, data);
      });
    },
    [updateDocument]
  );

  return {
    documents,
    selectedDocument,
    setDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    getDocumentById,
    getDocumentsByType,
    searchDocuments,
    getRecentDocuments,
    updateMultipleDocuments,
  };
}
