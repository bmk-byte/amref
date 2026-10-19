"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Category } from "@/lib/types";
import type { PublicAsset } from "@/lib/public-assets";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { AssetCard, AssetViewer, FileIcon, SearchIcon } from "../../public-browser";
import { loadMoreAssets } from "../actions";

export default function BrowseView({
  categories,
  activeCategory,
  categorySlug,
  initialQuery,
  initialAssets,
  initialCursor,
}: {
  categories: Category[];
  activeCategory: Category | null;
  categorySlug: string | undefined;
  initialQuery: string;
  initialAssets: PublicAsset[];
  initialCursor: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 350);
  const [assets, setAssets] = useState(initialAssets);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const [openAsset, setOpenAsset] = useState<PublicAsset | null>(null);

  // Only navigates once the debounced value actually diverges from what the
  // server already rendered for — avoids firing on mount, and naturally
  // stops once the resulting navigation brings initialQuery back in sync.
  useEffect(() => {
    if (debouncedQuery === initialQuery) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    const qs = params.toString();
    const base = categorySlug ? `/browse/${categorySlug}` : "/browse";
    router.replace(qs ? `${base}?${qs}` : base);
  }, [debouncedQuery, initialQuery, categorySlug, router]);

  function handleLoadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMoreAssets({
        q: debouncedQuery || undefined,
        categorySlug,
        cursor,
      });
      setAssets((prev) => [...prev, ...result.assets]);
      setCursor(result.nextCursor);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-brand-black">
          {activeCategory ? activeCategory.name : "All resources"}
        </h1>
        {initialQuery && (
          <p className="mt-1 text-sm text-brand-muted">Results matching "{initialQuery}"</p>
        )}
      </div>

      <div className="sticky top-16 z-10 -mx-4 mb-8 border-b border-brand-line bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, descriptions, tags…"
              className="w-full rounded-full border border-brand-line bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-orange"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/browse"
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-90 ${
                !categorySlug
                  ? "border-brand-orange bg-brand-orange text-white shadow-sm shadow-brand-orange/30"
                  : "border-brand-line text-brand-muted hover:border-brand-orange hover:text-brand-orange"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/browse/${c.slug}`}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-90 ${
                  categorySlug === c.slug
                    ? "border-brand-orange bg-brand-orange text-white shadow-sm shadow-brand-orange/30"
                    : "border-brand-line text-brand-muted hover:border-brand-orange hover:text-brand-orange"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {assets.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onOpen={() => setOpenAsset(asset)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FileIcon />
          <p className="text-sm text-brand-muted">No materials match.</p>
        </div>
      )}

      {cursor && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-full border border-brand-line px-5 py-2 text-sm font-medium text-brand-muted transition-all hover:border-brand-orange hover:text-brand-orange disabled:opacity-50"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      {openAsset && <AssetViewer asset={openAsset} onClose={() => setOpenAsset(null)} />}
    </div>
  );
}
