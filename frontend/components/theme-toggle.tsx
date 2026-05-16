'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-6 w-11" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Cambiar tema"
      data-testid="theme-switch"
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isDark ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-background shadow-sm transition-transform ${
          isDark ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-primary" aria-hidden />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" aria-hidden />
        )}
      </span>
    </button>
  );
}
