"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Assets" },
  { href: "/admin/consent", label: "Consent Records" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-1 gap-y-1 text-sm">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 transition-all ${
              isActive
                ? "bg-brand-orange/10 font-medium text-brand-orange"
                : "text-black/70 hover:text-brand-orange"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <Link href="/" className="rounded-full px-3 py-1.5 text-black/70 hover:text-brand-orange">
        View public site
      </Link>
    </nav>
  );
}
