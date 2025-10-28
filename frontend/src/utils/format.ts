// Formatting Utilities for dates and numbers
// Based on spec.md requirements

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format ISO 8601 timestamp or Unix timestamp to human-readable format
 * @param isoString - ISO 8601 timestamp or Unix timestamp string
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  isoString: string,
  options?: {
    includeTime?: boolean;
    relative?: boolean;
    locale?: string;
  }
): string {
  // Parse date - handle both ISO 8601 and Unix timestamps
  let date: Date;
  if (/^\d+(\.\d+)?$/.test(isoString)) {
    // Unix timestamp (seconds)
    date = new Date(parseFloat(isoString) * 1000);
  } else {
    // ISO 8601 format
    date = new Date(isoString);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const locale = options?.locale || 'zh-CN';

  // Return relative time if requested
  if (options?.relative) {
    return getRelativeTime(date, locale);
  }

  // Format date with or without time
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (options?.includeTime) {
    dateFormatOptions.hour = '2-digit';
    dateFormatOptions.minute = '2-digit';
  }

  return new Intl.DateTimeFormat(locale, dateFormatOptions).format(date);
}

/**
 * Get relative time string (e.g., "2小时前", "3天前")
 */
export function getRelativeTime(date: Date, locale = 'zh-CN'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (locale === 'zh-CN') {
    if (diffSeconds < 60) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    if (diffMonths < 12) return `${diffMonths}个月前`;
    return `${diffYears}年前`;
  } else {
    // English
    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number, locale = 'zh-CN'): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (locale === 'zh-CN') {
    if (seconds < 60) return `${seconds}秒`;
    if (minutes < 60) return `${minutes}分${seconds % 60}秒`;
    return `${hours}小时${minutes % 60}分`;
  } else {
    if (seconds < 60) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    return `${hours}h ${minutes % 60}m`;
  }
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, locale = 'zh-CN'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number, locale = 'zh-CN'): string {
  const units = locale === 'zh-CN' ? ['B', 'KB', 'MB', 'GB', 'TB'] : ['B', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) return `0 ${units[0]}`;

  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

// ============================================================================
// String Formatting
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
