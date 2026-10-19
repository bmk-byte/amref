import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Asset, AssetStatus, Category } from "@/lib/types";
import StatusBadge from "./status-badge";

export default async function OverviewPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: assets }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("assets")
      .select("*, categories(id, slug, name, sort_order)")
      .order("updated_at", { ascending: false }),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedAssets = (assets ?? []) as Asset[];

  const counts: Record<AssetStatus, number> = {
    draft: 0,
    pending_consent: 0,
    cleared: 0,
    published: 0,
    rejected: 0,
  };
  for (const a of typedAssets) counts[a.status]++;
  const needsAttention = counts.pending_consent + counts.cleared;

  const categoryCounts = typedCategories.map((c) => {
    const inCategory = typedAssets.filter((a) => a.category_id === c.id);
    return {
      category: c,
      total: inCategory.length,
      published: inCategory.filter((a) => a.status === "published").length,
    };
  });

  const recent = typedAssets.slice(0, 8);

  const metrics = [
    { label: "Total resources", value: typedAssets.length },
    { label: "Published", value: counts.published },
    { label: "Draft", value: counts.draft },
    { label: "Rejected", value: counts.rejected },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-black">Overview</h1>
        <p className="mt-1 text-sm text-black/60">
          Current state of the resource library across all categories.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="text-2xl font-semibold text-brand-black">{m.value}</div>
            <div className="mt-1 text-xs text-black/50">{m.label}</div>
          </div>
        ))}
      </div>

      {needsAttention > 0 && (
        <div className="mb-8 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <strong>{needsAttention}</strong> item{needsAttention === 1 ? "" : "s"} carry a legacy
          status (pending consent / cleared) from before the consent workflow was retired.{" "}
          <Link href="/admin/resources?status=cleared" className="underline hover:text-brand-orange">
            Review them
          </Link>
          .
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-brand-black">Recently updated</h2>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            {recent.length === 0 ? (
              <p className="p-6 text-center text-sm text-black/40">No resources yet.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {recent.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-brand-black">{a.title}</div>
                      <div className="text-xs text-black/40">{a.categories?.name ?? "—"}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/admin/resources"
            className="mt-3 inline-block text-xs font-medium text-brand-orange hover:underline"
          >
            View all resources →
          </Link>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-brand-black">By category</h2>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <ul className="divide-y divide-black/5">
              {categoryCounts.map(({ category, total, published }) => (
                <li key={category.id}>
                  <Link
                    href={`/admin/resources?category=${category.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-brand-gray"
                  >
                    <span className="text-brand-black">{category.name}</span>
                    <span className="text-xs text-black/40">
                      {published}/{total} published
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
