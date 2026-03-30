import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('paperlens_theme') as Theme;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      console.error('Failed to access localStorage', e);
    }
    
    // Check system preference as fallback
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light'; // Default to light mode
  });

  useEffect(() => {
    try {
      localStorage.setItem('paperlens_theme', theme);
    } catch (e) {
      console.error('Failed to set localStorage', e);
    }
    
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}
