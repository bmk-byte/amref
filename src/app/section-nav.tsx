"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export default function SectionNav({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => !!el);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <nav className="hidden gap-1 text-sm md:flex">
      {categories.map((c) => (
        <a
          key={c.id}
          href={`#${c.slug}`}
          onClick={() => setActive(c.slug)}
          className={`rounded-full px-3 py-1.5 transition-all active:scale-95 ${
            active === c.slug
              ? "bg-brand-red/10 font-medium text-brand-red"
              : "text-brand-muted hover:text-brand-red"
          }`}
        >
          {c.name}
        </a>
      ))}
    </nav>
  );
}
