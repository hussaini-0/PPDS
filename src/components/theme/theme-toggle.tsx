"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const THEME_EVENT = "ppds-theme-change";
const THEME_KEY = "ppds-theme";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const label = isDark ? "Use light mode" : "Use dark mode";

  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300",
        className,
      )}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </button>
  );
}
