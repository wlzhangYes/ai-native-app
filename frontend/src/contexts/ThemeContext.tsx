// Theme Context Provider
// Based on data-model.md context design

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { getTheme, setTheme as saveTheme } from '@/services/storage/localStorage';

// ============================================================================
// Context Type
// ============================================================================

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());

  // Apply theme on mount and when it changes
  useEffect(() => {
    // Update document class for CSS styling
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentTheme);

    // Save to localStorage
    saveTheme(currentTheme);
  }, [currentTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
  };

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  // Ant Design theme configuration
  const antdThemeConfig = {
    algorithm: currentTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 4,
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdThemeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
