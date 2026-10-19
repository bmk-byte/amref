"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SidebarNav from "./sidebar-nav";
import SignOutButton from "./sign-out-button";
import ThemeToggle from "../../theme-toggle";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CollapseIcon({ className, collapsed }: { className?: string; collapsed: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d={collapsed ? "M7.5 4l6 6-6 6" : "M12.5 4l-6 6 6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-brand-gray">
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-black/10 bg-white transition-all duration-200 lg:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-black/10 px-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <Image src="/heroes-logo.png" alt="H4GT" width={660} height={640} className="h-7 w-auto shrink-0" />
            {!collapsed && <span className="truncate text-sm font-semibold text-brand-black">H4GT Admin</span>}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center gap-2 border-t border-black/10 px-3 py-3 text-xs text-black/50 hover:text-brand-orange"
        >
          <CollapseIcon collapsed={collapsed} className="h-4 w-4" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-950/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-black/10 px-4">
              <span className="text-sm font-semibold text-brand-black">H4GT Admin</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="text-black/60 hover:text-brand-orange"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-black/10 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="text-black/60 hover:text-brand-orange lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="font-semibold text-brand-black lg:hidden">H4GT Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-black/60 sm:inline">{userEmail}</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
