import { useCallback, useState } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface UseApiClientOptions {
  onError?: (error: AxiosError) => void;
  onSuccess?: () => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: AxiosError | null;
}

/**
 * useApiClient Hook - HTTP 请求客户端
 *
 * 封装 Axios，提供统一的 API 调用接口
 * 支持自动错误处理、loading 状态管理
 *
 * @param options - 配置选项
 * @returns { request, state } - 请求函数和状态
 *
 * @example
 * ```tsx
 * const { request, state } = useApiClient({
 *   onError: (err) => message.error(err.message)
 * });
 *
 * const fetchData = async () => {
 *   const result = await request<User[]>('/users', { method: 'GET' });
 *   console.log(result);
 * };
 * ```
 */
export function useApiClient<T = any>(options: UseApiClientOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (
      url: string,
      config: AxiosRequestConfig = {}
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await axios({
          ...config,
          url: `${API_BASE_URL}${url}`,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
        });

        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        options.onSuccess?.();
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        setState({
          data: null,
          loading: false,
          error: axiosError,
        });

        options.onError?.(axiosError);
        return null;
      }
    },
    [options]
  );

  return { request, state };
}

/**
 * 使用预配置的 API 客户端直接发送请求（无状态管理）
 */
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    axios.get<T>(`${API_BASE_URL}${url}`, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axios.post<T>(`${API_BASE_URL}${url}`, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axios.put<T>(`${API_BASE_URL}${url}`, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    axios.delete<T>(`${API_BASE_URL}${url}`, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axios.patch<T>(`${API_BASE_URL}${url}`, data, config),
};
