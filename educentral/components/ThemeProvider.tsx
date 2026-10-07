"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = "educentral-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    let themeFrame: number | undefined;
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        applyTheme(savedTheme);
        themeFrame = window.requestAnimationFrame(() => setThemeState(savedTheme));
      }
    } catch (error) {
      console.error("Unable to load the saved theme preference:", error);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === "light" || event.newValue === "dark")) {
        setThemeState(event.newValue);
        applyTheme(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (themeFrame !== undefined) window.cancelAnimationFrame(themeFrame);
    };
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.error("Unable to save the theme preference:", error);
      throw new Error("Theme changed for this session, but its preference could not be saved.");
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
