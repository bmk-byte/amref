import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <header className="flex flex-col gap-3 border-b border-black/10 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="font-semibold text-brand-black">H4GT Admin</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/admin" className="text-black/70 hover:text-brand-red">
              Assets
            </Link>
            <Link href="/admin/consent" className="text-black/70 hover:text-brand-red">
              Consent Records
            </Link>
            <Link href="/" className="text-black/70 hover:text-brand-red">
              View public site
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-black/60 sm:justify-end">
          <span className="truncate">{user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
