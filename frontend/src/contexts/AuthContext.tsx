// Authentication Context Provider
// Based on data-model.md context design

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/models';
import * as authAPI from '@/services/api/auth';

// ============================================================================
// Context Type
// ============================================================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (redirectUri?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    // 禁用认证检查 - 后端没有 /api/auth/me 端点
    // checkAuth();

    // 直接设置为未认证状态
    setIsLoading(false);
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to check auth status:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (redirectUri?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.login({ redirectUri });
      if (response.success && response.data) {
        // Redirect to IAM SSO
        window.location.href = response.data.redirectUrl;
      }
    } catch (err) {
      const errorMessage = '登录失败，请重试';
      setError(errorMessage);
      console.error('[AuthContext] Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authAPI.logout();
      setUser(null);
      // Redirect to login or home page
      window.location.href = '/login';
    } catch (err) {
      const errorMessage = '登出失败，请重试';
      setError(errorMessage);
      console.error('[AuthContext] Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
