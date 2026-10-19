"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="2.5" width="6.5" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="8.5" width="6.5" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ResourcesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 2.75h7l3 3V17a.75.75 0 0 1-.75.75H5A.75.75 0 0 1 4.25 17V3.5A.75.75 0 0 1 5 2.75Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M7 9h6M7 12h6M7 6h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CategoriesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2.75 5.5A1.75 1.75 0 0 1 4.5 3.75h3l1.5 1.75h6.25a1.75 1.75 0 0 1 1.75 1.75V15a1.75 1.75 0 0 1-1.75 1.75H4.5A1.75 1.75 0 0 1 2.75 15V5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const LINKS = [
  { href: "/admin", label: "Overview", icon: OverviewIcon, exact: true },
  { href: "/admin/resources", label: "All Resources", icon: ResourcesIcon, exact: false },
  { href: "/admin/categories", label: "Categories", icon: CategoriesIcon, exact: false },
];

export default function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/resources/new"
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-lg bg-brand-orange px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 ${
          collapsed ? "justify-center" : ""
        }`}
        title="Add Resource"
      >
        <PlusIcon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Add Resource</span>}
      </Link>

      <nav className="flex flex-col gap-1">
        {LINKS.map((l) => {
          const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              title={collapsed ? l.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-brand-orange/10 font-medium text-brand-orange"
                  : "text-black/70 hover:bg-black/5 hover:text-brand-black"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{l.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
