'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/store/canvas';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings } = useCanvasStore();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Apply theme class to body for additional styling
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim() + ` theme-${settings.theme}`;
  }, [settings.theme]);

  return <>{children}</>;
}