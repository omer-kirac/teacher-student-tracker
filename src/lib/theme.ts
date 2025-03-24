import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeProvider() {
  const [theme, setThemeState] = useState<Theme>('light');

  // Load theme from localStorage on mount and check for system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Önce localStorage'dan tema tercihini al
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (storedTheme) {
      setThemeState(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Eğer kullanıcı bir tercih belirtmemişse ve işletim sistemi karanlık moddaysa
      setThemeState('dark');
    }

    // İşletim sistemi tema değişikliklerini dinle
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Sadece localStorage'da bir tercih yoksa sistem temasını kullan
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    // Add event listener for theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('theme', theme);
    
    // HTML dark class handling moved to providers.tsx for better coordination with Chakra UI
  }, [theme]);

  // Explicit setTheme function
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Toggle theme function
  const toggleTheme = () => {
    setThemeState(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      return newTheme;
    });
  };

  return { theme, toggleTheme, setTheme };
} 