import { useState, useEffect } from 'react';
import { FileItem } from '@/types';
import { fileApi } from '@/services/api';
import { File, Folder, ChevronRight, ChevronDown, RefreshCw, X, FileText } from 'lucide-react';
import clsx from 'clsx';

interface FileExplorerProps {
  sessionId: string | null;
}

export default function FileExplorer({ sessionId }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);

  const loadFiles = async (path: string = '/') => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const data = await fileApi.list(sessionId, path);
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (filePath: string) => {
    if (!sessionId) return;

    setLoadingContent(true);
    setSelectedFile(filePath);
    try {
      const content = await fileApi.getContent(sessionId, filePath);
      setFileContent(content);
    } catch (err) {
      console.error('Failed to load file content:', err);
      setFileContent('Error loading file content');
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // Clear preview when session changes
    setSelectedFile(null);
    setFileContent('');
  }, [sessionId]);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full text-anthropic-mid-gray text-sm">
        No session selected
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-anthropic-light-gray flex items-center justify-between">
        <span className="text-sm font-poppins font-semibold text-anthropic-dark">
          Workspace Files
        </span>
        <button
          onClick={() => loadFiles('/')}
          disabled={loading}
          className="p-1.5 hover:bg-anthropic-light rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={clsx('text-anthropic-mid-gray', loading && 'animate-spin')} />
        </button>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="border-b border-anthropic-light-gray bg-anthropic-light">
          <div className="flex items-center justify-between p-3 border-b border-anthropic-light-gray">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText size={16} className="text-anthropic-orange flex-shrink-0" />
              <span className="text-xs font-mono text-anthropic-dark truncate">{selectedFile}</span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setFileContent('');
              }}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <X size={14} className="text-anthropic-mid-gray" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-3">
            {loadingContent ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={16} className="animate-spin text-anthropic-mid-gray" />
              </div>
            ) : (
              <pre className="text-xs font-mono text-anthropic-dark whitespace-pre-wrap break-words">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading && files.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-anthropic-mid-gray">
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-anthropic-mid-gray text-sm px-4 text-center">
            <Folder size={48} className="mb-2 opacity-50" />
            <p>No files found</p>
            <p className="text-xs mt-1">
              Files will appear here once the workspace has content
            </p>
          </div>
        ) : (
          <div className="divide-y divide-anthropic-light-gray">
            {files.map((file) => (
              <div key={file.path}>
                {file.type === 'directory' ? (
                  <button
                    onClick={() => toggleDir(file.path)}
                    className="w-full flex items-center gap-2 p-3 hover:bg-anthropic-light transition-colors text-left"
                  >
                    {expandedDirs.has(file.path) ? (
                      <ChevronDown size={16} className="text-anthropic-mid-gray flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-anthropic-mid-gray flex-shrink-0" />
                    )}
                    <Folder size={16} className="text-anthropic-blue flex-shrink-0" />
                    <span className="text-sm text-anthropic-dark truncate">{file.name}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => loadFileContent(file.path)}
                    className={clsx(
                      'w-full flex items-center gap-2 p-3 hover:bg-anthropic-light transition-colors text-left',
                      selectedFile === file.path && 'bg-anthropic-light'
                    )}
                  >
                    <File size={16} className="text-anthropic-mid-gray flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-anthropic-dark truncate">{file.name}</p>
                      {file.size && (
                        <p className="text-xs text-anthropic-mid-gray">{formatSize(file.size)}</p>
                      )}
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
