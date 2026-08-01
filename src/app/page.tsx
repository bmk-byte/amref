import { createPublicClient } from "@/lib/supabase/public";
import type { Asset, Category } from "@/lib/types";
import PublicBrowser, { type PublicAsset } from "./public-browser";
import SectionNav from "./section-nav";

// Time-based safety net only — actions.ts already calls revalidatePath("/")
// on publish/unpublish/delete, so real changes show up immediately via
// on-demand revalidation. This just bounds how stale the cache can get
// otherwise, while letting Next/Vercel actually cache the rendered page.
export const revalidate = 300;

export default async function HomePage() {
  const supabase = createPublicClient();

  const [{ data: categories }, { data: assets }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("assets")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedAssets = (assets ?? []) as Asset[];

  // Only pre-sign what the grid actually needs to render previews: thumbnails,
  // and the file itself for images (there's no separate image-thumbnail pipeline
  // yet). PDFs/videos/docs are NOT pre-signed here — their full file URL is only
  // fetched on demand (getPublishedAssetUrl) when a visitor opens the viewer for
  // that specific item, so a single page load can't be used to bulk-harvest every
  // published file's URL at once.
  const paths = typedAssets.flatMap((a) => {
    const p: string[] = [];
    if (a.thumbnail_path) p.push(a.thumbnail_path);
    if (a.file_type?.startsWith("image/")) p.push(a.storage_path);
    return p;
  });
  let signedUrlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("h4gt-assets").createSignedUrls(paths, 3600);
    signedUrlMap = new Map(
      (signedUrls ?? [])
        .map((s): [string, string] => [s.path ?? "", s.signedUrl ?? ""])
        .filter(([p]) => p)
    );
  }

  const publicAssets: PublicAsset[] = typedAssets.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    credit: a.credit,
    tags: a.tags,
    file_type: a.file_type,
    category_id: a.category_id,
    url: a.file_type?.startsWith("image/") ? signedUrlMap.get(a.storage_path) ?? null : null,
    thumbnailUrl: a.thumbnail_path ? signedUrlMap.get(a.thumbnail_path) ?? null : null,
  }));

  const assetCount = publicAssets.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-brand-line bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="https://i0.wp.com/amref.org/uganda/wp-content/uploads/sites/4/2020/03/white.png?fit=1460%2C862&ssl=1"
              alt="Amref Health Africa"
              width={1460}
              height={862}
              className="h-8 w-auto shrink-0 aspect-[1460/862]"
            />
            <span className="hidden text-sm font-medium text-brand-muted sm:inline">
              H4GT Resource Library
            </span>
          </div>
          {typedCategories.length > 0 && <SectionNav categories={typedCategories} />}
        </div>
      </header>

      <section className="border-b border-brand-line bg-gradient-to-b from-brand-gray/70 to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-brand-red">
            Amref Health Africa — Uganda
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.1] font-medium text-brand-black sm:text-5xl">
            Heroes For Gender Transformative
            <span className="block text-brand-muted">Resource Library</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-muted">
            Reports, abstracts, human interest stories, photos, IEC materials, and the impact series
            from the H4GT project — preserved, credited, and shared publicly so its impact keeps
            reaching partners, donors, researchers, and communities.
          </p>
          {assetCount > 0 && (
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
            <h3 className="mb-2 font-display text-base text-brand-black">Terms of use</h3>
            <p className="leading-relaxed text-brand-muted">
              Materials in this library are © Amref Health Africa in Uganda and may be viewed here
              for learning, reference, and advocacy purposes related to gender transformative work.
              Downloading, copying, or redistributing files outside this site is not permitted
              without prior written permission — contact the Amref Uganda Communications Unit to
              request use of a specific item.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-display text-base text-brand-black">Consent &amp; takedowns</h3>
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
