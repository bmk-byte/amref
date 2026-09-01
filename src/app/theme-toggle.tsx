"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted transition hover:text-brand-orange ${className}`}
    >
      {!mounted ? null : dark ? (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M10 3.5V2M10 18v-1.5M16.5 10H18M2 10h1.5M14.6 5.4l1.1-1.1M4.3 15.7l1.1-1.1M14.6 14.6l1.1 1.1M4.3 4.3l1.1 1.1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
