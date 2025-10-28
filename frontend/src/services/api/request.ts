// Axios Request Wrapper with Interceptors
// Based on research.md technical decisions

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds
  withCredentials: false, // 禁用 credentials，避免 CORS 冲突
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Loading State (optional - can be moved to a store)
// ============================================================================

let activeRequests = 0;

function setLoading(loading: boolean) {
  if (loading) {
    activeRequests++;
  } else {
    activeRequests--;
  }
  // Emit loading state to global store if needed
  // useLoadingStore.getState().setLoading(activeRequests > 0);
}

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    setLoading(true);

    // Add custom headers if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    setLoading(false);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor with Error Handling
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>):any => {
    setLoading(false);

    // Return the data field directly for convenience
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data; // Return ApiResponse<T>
    }

    // 如果后端没有使用 ApiResponse 包装，自动包装
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },
  async (error: AxiosError<ApiResponse>) => {
    setLoading(false);

    // Network error (no response)
    if (!error.response) {
      message.error('网络连接失败，请检查您的网络设置');
      return Promise.reject({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络连接失败',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    const { status, data } = error.response;

    // Handle specific HTTP status codes
    switch (status) {
      case 401:
        // Unauthorized - try to refresh token
        try {
          const refreshed = await refreshToken();
          if (refreshed && error.config) {
            // Retry the original request
            return apiClient.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed - redirect to login
          message.error('登录已过期，请重新登录');
          window.location.href = '/login';
          break;
        }
        break;

      case 403:
        // Forbidden - insufficient permissions
        message.error('您没有权限访问此资源');
        break;

      case 404:
        // Not found
        message.error('请求的资源不存在');
        break;

      case 409:
        // Conflict (e.g., duplicate project name)
        if (data?.error?.message) {
          message.warning(data.error.message);
        } else {
          message.warning('操作冲突，请稍后重试');
        }
        break;

      case 422:
        // Validation error
        if (data?.error?.message) {
          message.error(data.error.message);
        } else {
          message.error('请求参数验证失败');
        }
        break;

      case 429:
        // Too many requests
        message.warning('请求过于频繁，请稍后再试');
        break;

      case 500:
        // Internal server error
        message.error('服务器内部错误，请联系管理员');
        break;

      case 502:
      case 503:
      case 504:
        // Service unavailable
        message.error('服务暂时不可用，请稍后重试');
        break;

      default:
        // Generic error message
        if (data?.error?.message) {
          message.error(data.error.message);
        } else {
          message.error(`请求失败 (${status})`);
        }
    }

    // Return structured error response
    return Promise.reject({
      success: false,
      error: data?.error || {
        code: `HTTP_${status}`,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
);

// ============================================================================
// Token Refresh Logic
// ============================================================================

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<boolean> {
  if (isRefreshing) {
    // Wait for the ongoing refresh to complete
    return new Promise((resolve) => {
      subscribeTokenRefresh(() => resolve(true));
    });
  }

  isRefreshing = true;

  try {
    // Call refresh endpoint (httpOnly cookie will be sent automatically)
    const response = await axios.post<ApiResponse>(
      `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    if (response.data.success) {
      isRefreshing = false;
      onTokenRefreshed('refreshed');
      return true;
    }

    isRefreshing = false;
    return false;
  } catch (error) {
    isRefreshing = false;
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make a GET request
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return apiClient.get<ApiResponse<T>, ApiResponse<T>>(url, config);
}

/**
 * Make a POST request
 */
export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return apiClient.post<ApiResponse<T>, ApiResponse<T>>(url, data, config);
}

/**
 * Make a PUT request
 */
export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return apiClient.put<ApiResponse<T>, ApiResponse<T>>(url, data, config);
}

/**
 * Make a PATCH request
 */
export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return apiClient.patch<ApiResponse<T>, ApiResponse<T>>(url, data, config);
}

/**
 * Make a DELETE request
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return apiClient.delete<ApiResponse<T>, ApiResponse<T>>(url, config);
}

/**
 * Upload file with multipart/form-data
 */
export async function upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return apiClient.post<ApiResponse<T>, ApiResponse<T>>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
  });
}

// Export the configured axios instance for direct use if needed
export { apiClient };
export default apiClient;
