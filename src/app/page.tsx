import { createPublicClient } from "@/lib/supabase/public";
import { listHomepagePreviews } from "@/lib/queries/assets";
import { toPublicAssets } from "@/lib/public-assets";
import type { Asset, Category } from "@/lib/types";
import PublicBrowser from "./public-browser";
import SiteHeader from "./site-header";

// Time-based safety net only — actions.ts already calls revalidatePath("/")
// on publish/unpublish/delete, so real changes show up immediately via
// on-demand revalidation. This just bounds how stale the cache can get
// otherwise, while letting Next/Vercel actually cache the rendered page.
export const revalidate = 300;

// Bounded preview per category, not the full table — at scale this keeps the
// homepage's cost constant regardless of total published-asset count. Full
// per-category/search results live at /browse.
const PREVIEW_LIMIT = 9;

export default async function HomePage() {
  const supabase = createPublicClient();

  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
  const typedCategories = (categories ?? []) as Category[];

  const [previewsByCategory, { count: assetCount }] = await Promise.all([
    listHomepagePreviews(supabase, typedCategories, PREVIEW_LIMIT),
    supabase.from("assets").select("*", { count: "estimated", head: true }).eq("status", "published"),
  ]);

  const typedAssets: Asset[] = Array.from(previewsByCategory.values()).flat();
  const publicAssets = await toPublicAssets(supabase, typedAssets);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader categories={typedCategories} />

      <section className="border-b border-brand-line bg-gradient-to-b from-brand-gray/70 to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
            Amref Health Africa — Uganda
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.1] font-bold text-brand-black sm:text-5xl">
            Heroes For Gender Transformative
            <span className="block text-brand-muted">Resource Library</span>
          </h1>
          <p className="mt-3 text-sm font-medium text-brand-green">
            Supporting Community Solutions for Sustainable Health Outcomes
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-muted">
            Reports, technical approaches, abstracts, human interest stories, photos, IEC materials,
            videos, and more from the H4GT project — preserved, credited, and shared publicly so its
            impact keeps reaching partners, donors, researchers, and communities.
          </p>
          {assetCount !== null && assetCount > 0 && (
            <p className="mt-6 text-sm text-brand-muted">
              <span className="font-semibold text-brand-black">{assetCount}</span> published item
              {assetCount === 1 ? "" : "s"} across {typedCategories.length} sections
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <PublicBrowser categories={typedCategories} assets={publicAssets} />
      </main>

      <footer className="border-t border-brand-line bg-brand-gray/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm sm:grid-cols-2 sm:px-6">
          <div>
            <h3 className="mb-2 font-display text-base font-semibold text-brand-black">Terms of use</h3>
            <p className="leading-relaxed text-brand-muted">
              Materials in this library are © Amref Health Africa in Uganda and may be viewed here
              for learning, reference, and advocacy purposes related to gender transformative work.
              Downloading, copying, or redistributing files outside this site is not permitted
              without prior written permission — contact the Amref Uganda Communications Unit to
              request use of a specific item.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-display text-base font-semibold text-brand-black">Consent &amp; takedowns</h3>
            <p className="leading-relaxed text-brand-muted">
              Photos and personal stories are published only where consent was given by the
              individuals featured. If you believe material should not be public, contact the Amref
              Uganda Communications Unit.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
