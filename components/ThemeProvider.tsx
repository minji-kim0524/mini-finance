"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeCtxValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ theme: "light", toggle: () => {} });

export function UseTheme() {
  return useContext(ThemeCtx);
}

const THEME_KEY = "theme";

function getSnapshot(): Theme {
  const saved = localStorage.getItem(THEME_KEY) as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function Toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
  }

  return <ThemeCtx.Provider value={{ theme, toggle: Toggle }}>{children}</ThemeCtx.Provider>;
}
