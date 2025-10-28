// Files API Service (Claude Agent Service Backend)
// 替换原有的 Document API，使用文件浏览功能

import { get } from './request';
import type { ApiResponse } from '@/types/api';

// ============================================================================
// Files Types (Backend Schema)
// ============================================================================

export interface FileItem {
  name: string;
  path: string; // 相对路径
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export interface FileListResponse {
  files: FileItem[];
  path: string;
  total: number;
}

export interface FileContentResponse {
  path: string;
  content: string;
  size: number;
}

// ============================================================================
// Files API Functions
// ============================================================================

/**
 * 列出工作区文件和目录
 */
export async function getFiles(
  sessionId: string,
  path: string = '/'
): Promise<ApiResponse<FileListResponse>> {
  return get<FileListResponse>(`/sessions/${sessionId}/files`, {
    params: { path },
  });
}

/**
 * 获取文件内容
 */
export async function getFileContent(
  sessionId: string,
  path: string
): Promise<ApiResponse<FileContentResponse>> {
  return get<FileContentResponse>(`/sessions/${sessionId}/files/content`, {
    params: { path },
  });
}

/**
 * 检查路径是否为目录
 */
export function isDirectory(item: FileItem): boolean {
  return item.type === 'directory';
}

/**
 * 检查路径是否为文件
 */
export function isFile(item: FileItem): boolean {
  return item.type === 'file';
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * 判断是否为文本文件（可预览）
 */
export function isTextFile(filename: string): boolean {
  const textExtensions = [
    'txt',
    'md',
    'markdown',
    'json',
    'yaml',
    'yml',
    'xml',
    'html',
    'htm',
    'css',
    'scss',
    'less',
    'js',
    'jsx',
    'ts',
    'tsx',
    'py',
    'java',
    'c',
    'cpp',
    'h',
    'hpp',
    'go',
    'rs',
    'rb',
    'php',
    'sh',
    'bash',
    'sql',
    'log',
    'ini',
    'conf',
    'config',
  ];

  const ext = getFileExtension(filename);
  return textExtensions.includes(ext);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 解析文件路径
 */
export function parsePath(path: string): {
  directory: string;
  filename: string;
  extension: string;
} {
  const parts = path.split('/');
  const filename = parts[parts.length - 1];
  const directory = parts.slice(0, -1).join('/') || '/';
  const extension = getFileExtension(filename);

  return { directory, filename, extension };
}
