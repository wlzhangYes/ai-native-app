// Input Validation Utilities
// Based on spec.md requirements

// ============================================================================
// Project Validation
// ============================================================================

/**
 * Validate project name
 * FR-081: Maximum 255 characters
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '项目名称不能为空' };
  }

  if (name.length > 255) {
    return { valid: false, error: '项目名称不能超过 255 个字符' };
  }

  return { valid: true };
}

/**
 * Validate project description
 */
export function validateProjectDescription(description?: string): { valid: boolean; error?: string } {
  if (description && description.length > 1000) {
    return { valid: false, error: '项目描述不能超过 1000 个字符' };
  }

  return { valid: true };
}

// ============================================================================
// Document Validation
// ============================================================================

/**
 * Validate document name
 */
export function validateDocumentName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '文档名称不能为空' };
  }

  if (name.length > 100) {
    return { valid: false, error: '文档名称不能超过 100 个字符' };
  }

  // Check if name has valid file extension
  const validExtensions = ['.md', '.txt', '.html'];
  const hasValidExtension = validExtensions.some((ext) => name.endsWith(ext));

  if (!hasValidExtension) {
    return { valid: false, error: '文档名称必须以 .md, .txt, 或 .html 结尾' };
  }

  return { valid: true };
}

/**
 * Validate document content length
 * (Based on performance goal: <30s generation for 5000 words)
 */
export function validateDocumentContent(content: string): { valid: boolean; error?: string; warning?: string } {
  if (content.length > 50000) {
    return { valid: false, error: '文档内容过长（超过 50,000 个字符）' };
  }

  if (content.length > 30000) {
    return { valid: true, warning: '文档内容较长，生成可能需要较长时间' };
  }

  return { valid: true };
}

// ============================================================================
// Message Validation
// ============================================================================

/**
 * Validate user message content
 */
export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '消息内容不能为空' };
  }

  if (content.length > 5000) {
    return { valid: false, error: '消息内容不能超过 5000 个字符' };
  }

  return { valid: true };
}

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    return { valid: false, error: '邮箱地址不能为空' };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: '邮箱地址格式不正确' };
  }

  return { valid: true };
}

// ============================================================================
// Generic Validation
// ============================================================================

/**
 * Check if string is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Check if value is within length range
 */
export function isWithinLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}
