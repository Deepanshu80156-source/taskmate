import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'green' | 'blue' | 'purple';

// HSL values for --primary, --primary-foreground, --sidebar, --sidebar-primary
const COLOR_MAP: Record<ThemeColor, { primary: string; sidebar: string }> = {
  green:  { primary: '142 72% 29%', sidebar: '145 40% 12%' },
  blue:   { primary: '217 91% 40%', sidebar: '220 50% 12%' },
  purple: { primary: '271 81% 40%', sidebar: '270 50% 12%' },
};

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyColor(color: ThemeColor) {
  const vals = COLOR_MAP[color];
  document.documentElement.style.setProperty('--primary', vals.primary);
  document.documentElement.style.setProperty('--sidebar', vals.sidebar);
  document.documentElement.style.setProperty('--sidebar-primary', vals.primary);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('taskmate_dark') === 'true'; } catch { return false; }
  });

  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    try {
      const stored = localStorage.getItem('taskmate_color') as ThemeColor;
      return (stored && COLOR_MAP[stored]) ? stored : 'green';
    } catch { return 'green'; }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('taskmate_dark', String(darkMode)); } catch {}
  }, [darkMode]);

  useEffect(() => {
    applyColor(themeColor);
    try { localStorage.setItem('taskmate_color', themeColor); } catch {}
  }, [themeColor]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const setThemeColor = (color: ThemeColor) => setThemeColorState(color);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
