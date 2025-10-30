// Unit tests for useApiClient hook
// Tests HTTP client functionality with error handling and request configuration

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { useApiClient } from './useApiClient';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('useApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock implementation
    mockedAxios.create.mockReturnValue({
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    } as any);
  });

  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useApiClient());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.client).toBeDefined();
  });

  it('should create axios client with default config', () => {
    renderHook(() => useApiClient());

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should create axios client with custom config', () => {
    const customConfig = {
      baseURL: 'https://api.example.com',
      timeout: 5000,
      headers: {
        'Authorization': 'Bearer token123',
      },
    };

    renderHook(() => useApiClient(customConfig));

    expect(mockedAxios.create).toHaveBeenCalledWith(customConfig);
  });

  it('should handle successful GET request', async () => {
    const mockResponse = { data: { message: 'success' } };
    const mockClient = {
      get: vi.fn().mockResolvedValue(mockResponse),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useApiClient());

    let response;
    await act(async () => {
      response = await result.current.request({
        method: 'GET',
        url: '/test',
      });
    });

    expect(mockClient.get).toHaveBeenCalledWith('/test', undefined);
    expect(response).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful POST request with data', async () => {
    const mockResponse = { data: { id: 1 } };
    const requestData = { name: 'test' };
    const mockClient = {
      post: vi.fn().mockResolvedValue(mockResponse),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useApiClient());

    let response;
    await act(async () => {
      response = await result.current.request({
        method: 'POST',
        url: '/users',
        data: requestData,
      });
    });

    expect(mockClient.post).toHaveBeenCalledWith('/users', requestData, undefined);
    expect(response).toEqual(mockResponse);
  });

  it('should set loading state during request', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const mockClient = {
      get: vi.fn().mockReturnValue(promise),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useApiClient());

    // Start request
    act(() => {
      result.current.request({ method: 'GET', url: '/test' });
    });

    // Should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    // Resolve request
    await act(async () => {
      resolvePromise!({ data: 'success' });
    });

    // Should no longer be loading
    expect(result.current.loading).toBe(false);
  });

  it('should handle request errors', async () => {
    const errorMessage = 'Network Error';
    const mockClient = {
      get: vi.fn().mockRejectedValue(new Error(errorMessage)),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useApiClient());

    let error;
    await act(async () => {
      try {
        await result.current.request({ method: 'GET', url: '/test' });
      } catch (e) {
        error = e;
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(expect.any(Error));
    expect(result.current.error?.message).toBe(errorMessage);
    expect(error).toBeDefined();
  });

  it('should clear error on new request', async () => {
    const mockClient = {
      get: vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: 'success' }),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useApiClient());

    // First request (fails)
    await act(async () => {
      try {
        await result.current.request({ method: 'GET', url: '/test' });
      } catch (e) {
        // Expected to fail
      }
    });

    expect(result.current.error).toBeDefined();

    // Second request (succeeds)
    await act(async () => {
      await result.current.request({ method: 'GET', url: '/test' });
    });

    expect(result.current.error).toBe(null);
  });

  it('should support different HTTP methods', async () => {
    const mockResponse = { data: 'success' };
    const mockClient = {
      get: vi.fn().mockResolvedValue(mockResponse),
      post: vi.fn().mockResolvedValue(mockResponse),
      put: vi.fn().mockResolvedValue(mockResponse),
      patch: vi.fn().mockResolvedValue(mockResponse),
      delete: vi.fn().mockResolvedValue(mockResponse),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);

    const { result } = renderHook(() => useApiClient());

    // Test different methods
    await act(async () => {
      await result.current.request({ method: 'GET', url: '/test' });
    });
    expect(mockClient.get).toHaveBeenCalled();

    await act(async () => {
      await result.current.request({ method: 'POST', url: '/test', data: {} });
    });
    expect(mockClient.post).toHaveBeenCalled();

    await act(async () => {
      await result.current.request({ method: 'PUT', url: '/test', data: {} });
    });
    expect(mockClient.put).toHaveBeenCalled();

    await act(async () => {
      await result.current.request({ method: 'PATCH', url: '/test', data: {} });
    });
    expect(mockClient.patch).toHaveBeenCalled();

    await act(async () => {
      await result.current.request({ method: 'DELETE', url: '/test' });
    });
    expect(mockClient.delete).toHaveBeenCalled();
  });
});