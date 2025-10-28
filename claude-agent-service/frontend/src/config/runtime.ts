/**
 * Runtime configuration
 * This allows changing API URL without rebuilding
 */

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

/**
 * Get API URL from multiple sources (priority order):
 * 1. window.__API_URL__ (runtime injection)
 * 2. NEXT_PUBLIC_API_URL (build-time)
 * 3. Default value
 */
export function getApiUrl(): string {
  // Priority 1: Runtime injection via window object
  if (isBrowser && (window as any).__API_URL__) {
    return (window as any).__API_URL__;
  }

  // Priority 2: Build-time environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Priority 3: Default (for development)
  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiUrl();

// Log API URL in development
if (isBrowser && process.env.NODE_ENV === 'development') {
  console.log('[API Config] Using API URL:', API_BASE_URL);
}
