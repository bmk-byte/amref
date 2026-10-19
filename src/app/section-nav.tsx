"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";

export default function SectionNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5 text-sm">
      {categories.map((c) => {
        const active = pathname === `/browse/${c.slug}`;
        return (
          <Link
            key={c.id}
            href={`/browse/${c.slug}`}
            className={`rounded-full px-3 py-1.5 transition-all active:scale-95 ${
              active
                ? "bg-brand-orange/10 font-medium text-brand-orange"
                : "text-brand-muted hover:text-brand-orange"
            }`}
          >
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}
