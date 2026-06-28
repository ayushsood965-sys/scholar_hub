import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (newTheme) {
          root.setAttribute('data-theme', 'dark');
        } else {
          root.removeAttribute('data-theme');
        }
      }
      return newTheme;
    });
  }, []);

  // Sync with DOM on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for theme-aware styles
export const useThemeStyles = () => {
  const { isDark } = useTheme();
  
  return {
    isDark,
    // Surface colors
    surface: isDark ? '#1e1e20' : '#FFFFFF',
    surfaceHover: isDark ? '#27272a' : '#F8FAFC',
    surfacePressed: isDark ? '#3f3f46' : '#F1F5F9',
    
    // Text colors
    textPrimary: isDark ? '#ffffff' : '#1F2937',
    textSecondary: isDark ? '#cbcccd' : '#4B5563',
    textMuted: isDark ? '#88898b' : '#6B7280',
    textPlaceholder: isDark ? '#6b6b6d' : '#9CA3AF',
    
    // Border colors
    border: isDark ? '#2d2d30' : '#E5E7EB',
    borderHover: isDark ? '#3f3f46' : '#D1D5DB',
    borderFocus: isDark ? '#34d399' : '#1A5A3B',
    
    // Input/Select styles
    inputBg: isDark ? 'rgba(24, 24, 27, 0.95)' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
    inputText: isDark ? '#ffffff' : '#1F2937',
    inputPlaceholder: isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF',
    
    // Dropdown menu
    dropdownBg: isDark ? 'rgba(30, 30, 32, 0.98)' : '#FFFFFF',
    dropdownBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB',
    dropdownItemHover: isDark ? 'rgba(255, 255, 255, 0.12)' : '#F1F5F9',
    
    // Card styles
    cardBg: isDark ? '#1e1e20' : '#FFFFFF',
    cardBorder: isDark ? '#2d2d30' : '#E5E7EB',
    cardShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    
    // Sidebar colors
    sidebarBg: isDark ? '#18181b' : '#133A26',
    sidebarHover: isDark ? '#27272a' : '#1A4D33',
    sidebarActive: isDark ? '#3f3f46' : '#1D5E3B',
    
    // Primary accent
    primary: isDark ? '#34d399' : '#1A5A3B',
    primaryHover: isDark ? '#10b981' : '#145332',
    primaryLight: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(26, 90, 59, 0.1)',
    
    // Status colors
    success: isDark ? '#34d399' : '#2E9E5B',
    warning: isDark ? '#fbbf24' : '#D97706',
    error: isDark ? '#f87171' : '#EF4444',
    info: isDark ? '#60a5fa' : '#3B82F6',
    
    // Status backgrounds
    successBg: isDark ? 'rgba(52, 211, 153, 0.15)' : '#ECFDF5',
    warningBg: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FFFBEB',
    errorBg: isDark ? 'rgba(248, 113, 113, 0.15)' : '#FEF2F2',
    infoBg: isDark ? 'rgba(96, 165, 250, 0.15)' : '#EFF6FF',
  };
};

export default ThemeContext;
