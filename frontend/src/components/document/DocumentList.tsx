// DocumentList Component - Display all files from workspace
// Integrated with Claude Agent Service Files API

import { useEffect, useState } from 'react';
import { Flex, Collapse, message, Empty, Spin } from 'antd';
import { FolderOutlined, FileOutlined, FileMarkdownOutlined, LoadingOutlined } from '@ant-design/icons';
import { getFiles, getFileContent, type FileItem } from '@/services/api/files';
import { useWorkflowStore } from '@/stores/useWorkflowStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { DocumentStatus } from '@/types/models';

export function DocumentList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const setSelectedDocument = useWorkflowStore((state) => state.setSelectedDocument);
  const setDocument = useDocumentStore((state) => state.setDocument);

  // Fetch files from workspace
  useEffect(() => {
    const fetchFiles = async () => {
      if (!currentProjectId) {
        console.warn('[DocumentList] No current project selected');
        return;
      }

      try {
        setLoading(true);

        // Get files from workspace root
        const response = await getFiles(currentProjectId, '/');

        if (response.data) {
          setFiles(response.data.files);
        } else {
          const errorMsg = typeof response.error === 'string'
            ? response.error
            : response.error?.message || '获取文件列表失败';
          message.error(errorMsg);
        }
      } catch (error) {
        console.error('[DocumentList] Failed to fetch files:', error);
        message.error('获取文件列表失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [currentProjectId]);

  // Get file icon based on type and name
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <FolderOutlined className="text-yellow-500 text-lg" />;
    }
    if (file.name.endsWith('.md')) {
      return <FileMarkdownOutlined className="text-blue-500 text-lg" />;
    }
    return <FileOutlined className="text-gray-400 text-lg" />;
  };

  // Format file size
  const formatSize = (bytes: number | null) => {
    if (bytes === null) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file click - load file content
  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      message.info('目录浏览功能开发中');
      return;
    }

    try {
      setLoadingFile(file.path);
      setSelectedFilePath(file.path);

      // Fetch file content
      const response = await getFileContent(currentProjectId!, file.path);

      if (response.data) {
        // Convert file content to Document format
        const document = {
          id: file.path,
          projectId: currentProjectId!,
          stageId: 'workspace', // Use 'workspace' as stage for files
          name: file.name,
          content: response.data.content,
          version: 1,
          status: DocumentStatus.Completed,
          metadata: {
            author: 'File',
            createdBy: 'system',
            lastModifiedBy: 'system',
            wordCount: response.data.content.split(/\s+/).length,
          },
          createdAt: file.modified || new Date().toISOString(),
          updatedAt: file.modified || new Date().toISOString(),
        };

        // Update document store first, then set as selected
        setDocument(document);
        setSelectedDocument(file.path);
      } else {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error?.message || '获取文件内容失败';
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('[DocumentList] Failed to load file:', error);
      message.error('获取文件内容失败');
    } finally {
      setLoadingFile(null);
    }
  };

  // Separate directories and files
  const directories = files.filter(f => f.type === 'directory');
  const regularFiles = files.filter(f => f.type === 'file');

  // Create collapse items for directories
  const collapseItems = directories.map((dir) => ({
    key: dir.path,
    label: (
      <Flex align="center" gap={8} className="py-1">
        <FolderOutlined className="text-yellow-500 text-lg" />
        <span className="font-medium text-gray-800">{dir.name}</span>
      </Flex>
    ),
    children: (
      <div className="text-sm text-gray-500 pl-7">
        点击文件夹查看内容（功能开发中）
      </div>
    ),
  }));

  if (loading) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Spin tip="加载文件列表..." />
      </Flex>
    );
  }

  if (!files.length) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Empty description="暂无文件" />
      </Flex>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white p-3">
      {/* Directories */}
      {directories.length > 0 && (
        <Collapse
          items={collapseItems}
          defaultActiveKey={[]}
          expandIconPosition="end"
          ghost
          className="document-folder-collapse mb-3"
        />
      )}

      {/* Files in root */}
      {regularFiles.length > 0 && (
        <div className="space-y-1">
          {regularFiles.map((file) => (
            <div
              key={file.path}
              className={`cursor-pointer px-4 py-2 rounded-md transition-all duration-200 ${
                selectedFilePath === file.path
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
              onClick={() => handleFileClick(file)}
            >
              <Flex align="center" gap={12}>
                {loadingFile === file.path ? (
                  <LoadingOutlined className="text-blue-500 text-lg" />
                ) : (
                  getFileIcon(file)
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      selectedFilePath === file.path ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {file.size !== null && formatSize(file.size)}
                  </div>
                </div>
              </Flex>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .document-folder-collapse .ant-collapse-item {
          border-radius: 8px;
          margin-bottom: 8px;
          border: 1px solid #f0f0f0 !important;
          background: white;
        }
        .document-folder-collapse .ant-collapse-item:last-child {
          margin-bottom: 8px;
        }
        .document-folder-collapse .ant-collapse-header {
          padding: 12px 16px !important;
          border-radius: 8px !important;
        }
        .document-folder-collapse .ant-collapse-content {
          border-top: 1px solid #f0f0f0 !important;
        }
        .document-folder-collapse .ant-collapse-content-box {
          padding: 8px 16px 12px !important;
        }
      `}</style>
    </div>
  );
}
