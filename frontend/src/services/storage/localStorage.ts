// LocalStorage Wrapper for User Preferences
// Based on research.md storage decisions

import type { UserPreferences, ColumnWidths } from '@/types/models';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  USER_PREFERENCES: 'workflow:preferences',
  COLUMN_WIDTHS: 'workflow:columnWidths',
  THEME: 'workflow:theme',
  LANGUAGE: 'workflow:language',
  AUTO_SAVE: 'workflow:autoSave',
} as const;

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'zh-CN',
  columnWidths: {
    left: 30, // 30%
    middle: 20, // 20%
    right: 50, // 50%
  },
  autoSave: true,
};

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  left: 30,
  middle: 20,
  right: 50,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse JSON from localStorage
 */
function safeParseJSON<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[LocalStorage] Failed to parse JSON:', error);
    return defaultValue;
  }
}

/**
 * Safely stringify and save to localStorage
 */
function safeSetItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[LocalStorage] Failed to save item:', error);
  }
}

// ============================================================================
// User Preferences
// ============================================================================

/**
 * Get all user preferences
 */
export function getUserPreferences(): UserPreferences {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  return safeParseJSON(stored, DEFAULT_PREFERENCES);
}

/**
 * Save all user preferences
 */
export function setUserPreferences(preferences: UserPreferences): void {
  safeSetItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
}

/**
 * Update specific preference fields
 */
export function updateUserPreferences(updates: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  const updated = { ...current, ...updates };
  setUserPreferences(updated);
}

// ============================================================================
// Column Widths
// ============================================================================

/**
 * Get column widths
 */
export function getColumnWidths(): ColumnWidths {
  const stored = localStorage.getItem(STORAGE_KEYS.COLUMN_WIDTHS);
  return safeParseJSON(stored, DEFAULT_COLUMN_WIDTHS);
}

/**
 * Save column widths
 */
export function setColumnWidths(widths: ColumnWidths): void {
  // Validate that widths sum to 100
  const sum = widths.left + widths.middle + widths.right;
  if (Math.abs(sum - 100) > 0.1) {
    console.warn('[LocalStorage] Column widths do not sum to 100%:', widths);
    return;
  }

  safeSetItem(STORAGE_KEYS.COLUMN_WIDTHS, widths);

  // Also update in user preferences
  updateUserPreferences({ columnWidths: widths });
}

// ============================================================================
// Theme
// ============================================================================

/**
 * Get theme preference
 */
export function getTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  return (stored as 'light' | 'dark') || DEFAULT_PREFERENCES.theme;
}

/**
 * Set theme preference
 */
export function setTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  updateUserPreferences({ theme });
}

// ============================================================================
// Language
// ============================================================================

/**
 * Get language preference
 */
export function getLanguage(): 'zh-CN' | 'en-US' {
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  return (stored as 'zh-CN' | 'en-US') || DEFAULT_PREFERENCES.language;
}

/**
 * Set language preference
 */
export function setLanguage(language: 'zh-CN' | 'en-US'): void {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  updateUserPreferences({ language });
}

// ============================================================================
// Auto Save
// ============================================================================

/**
 * Get auto-save preference
 */
export function getAutoSave(): boolean {
  const stored = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
  return stored === null ? DEFAULT_PREFERENCES.autoSave : stored === 'true';
}

/**
 * Set auto-save preference
 */
export function setAutoSave(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, String(enabled));
  updateUserPreferences({ autoSave: enabled });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all workflow-related data from localStorage
 */
export function clearAllPreferences(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Get storage usage estimate
 */
export function getStorageUsage(): number {
  let totalSize = 0;
  Object.values(STORAGE_KEYS).forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      totalSize += value.length * 2; // UTF-16 encoding = 2 bytes per character
    }
  });
  return totalSize;
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}
