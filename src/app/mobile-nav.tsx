"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export default function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted transition hover:text-brand-orange"
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path
              d="M3 5.5h14M3 10h14M3 14.5h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <nav className="absolute right-0 top-full z-40 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-brand-line bg-white p-2 shadow-[0_16px_40px_-16px_rgba(24,20,15,0.35)]">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#${c.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-brand-black transition hover:bg-brand-gray hover:text-brand-orange"
              >
                {c.name}
              </a>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
