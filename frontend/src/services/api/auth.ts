// Authentication API Service
// Based on contracts/openapi.yaml

import { get, post } from './request';
import type { ApiResponse, LoginRequest, LoginResponse, AuthMeResponse } from '@/types/api';

/**
 * Get IAM SSO login redirect URL
 */
export async function login(data?: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>('/auth/login', data);
}

/**
 * Logout current user
 */
export async function logout(): Promise<ApiResponse<void>> {
  return post<void>('/auth/logout');
}

/**
 * Get current authenticated user information
 */
export async function getCurrentUser(): Promise<ApiResponse<AuthMeResponse>> {
  return get<AuthMeResponse>('/auth/me');
}

/**
 * Refresh authentication token
 * (Note: This is called automatically by request interceptor on 401)
 */
export async function refreshToken(): Promise<ApiResponse<void>> {
  return post<void>('/auth/refresh');
}
