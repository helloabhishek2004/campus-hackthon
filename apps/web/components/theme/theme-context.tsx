"use client";

import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "campusgram_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep the server render deterministic; the DOM is corrected before paint below.
  const [theme, setThemeState] = useState<Theme>("dark");

  useLayoutEffect(() => {
    let nextTheme: Theme = "dark";
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") nextTheme = saved;
      else if (window.matchMedia("(prefers-color-scheme: light)").matches) nextTheme = "light";
    } catch {
      // Use the deterministic dark default when browser storage is unavailable.
    }
    setThemeState(nextTheme);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
