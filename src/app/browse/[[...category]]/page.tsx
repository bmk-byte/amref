import { createPublicClient } from "@/lib/supabase/public";
import { listPublishedAssets } from "@/lib/queries/assets";
import { toPublicAssets } from "@/lib/public-assets";
import type { Category } from "@/lib/types";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";
import BrowseView from "./browse-view";

const PAGE_LIMIT = 24;

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ category?: string[] }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { category } = await params;
  const { q } = await searchParams;
  const categorySlug = category?.[0];

  const supabase = createPublicClient();

  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
  const typedCategories = (categories ?? []) as Category[];

  // An unrecognized slug (stale/bad link) just falls back to showing
  // everything, rather than 404ing or redirecting — both notFound() and
  // redirect() were observed to leak their internal signal into the
  // rendered body instead of producing a real HTTP status in this setup,
  // so this avoids relying on that throw-based mechanism entirely.
  const activeCategory = categorySlug ? typedCategories.find((c) => c.slug === categorySlug) : undefined;
  const effectiveCategorySlug = activeCategory ? categorySlug : undefined;

  const { assets, nextCursor } = await listPublishedAssets(supabase, {
    q,
    categorySlug: effectiveCategorySlug,
    cursor: null,
    limit: PAGE_LIMIT,
  });
  const publicAssets = await toPublicAssets(supabase, assets);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader categories={typedCategories} />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <BrowseView
          key={`${effectiveCategorySlug ?? "all"}:${q ?? ""}`}
          categories={typedCategories}
          activeCategory={activeCategory ?? null}
          categorySlug={effectiveCategorySlug}
          initialQuery={q ?? ""}
          initialAssets={publicAssets}
          initialCursor={nextCursor}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
