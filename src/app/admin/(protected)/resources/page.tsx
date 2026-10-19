import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { listAssetsAdmin, type AdminSort } from "@/lib/queries/assets";
import type { AssetStatus, Category } from "@/lib/types";
import ResourcesTable from "./resources-table";

const PAGE_SIZE = 20;

const VALID_STATUSES: (AssetStatus | "all")[] = [
  "all",
  "draft",
  "pending_consent",
  "cleared",
  "published",
  "rejected",
];

function parseStatus(raw: string | undefined): AssetStatus | "all" {
  return (VALID_STATUSES as string[]).includes(raw ?? "") ? (raw as AssetStatus | "all") : "all";
}

function parseSort(raw: string | undefined): AdminSort {
  return raw === "oldest" || raw === "title" ? raw : "newest";
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const categorySlug = typeof sp.category === "string" && sp.category !== "all" ? sp.category : undefined;
  const status = parseStatus(typeof sp.status === "string" ? sp.status : undefined);
  const sort = parseSort(typeof sp.sort === "string" ? sp.sort : undefined);
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();

  const [{ data: categories }, { assets, totalCount }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    listAssetsAdmin(supabase, { q, categorySlug, status, sort, page, pageSize: PAGE_SIZE }),
  ]);

  const typedCategories = (categories ?? []) as Category[];

  const paths = assets.map((a) => a.storage_path).filter((p): p is string => !!p);
  const signedUrlMap: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("h4gt-assets").createSignedUrls(paths, 3600);
    for (const s of signedUrls ?? []) {
      if (s.path && s.signedUrl) signedUrlMap[s.path] = s.signedUrl;
    }
  }

  return (
    <Suspense fallback={<p className="text-sm text-black/50">Loading…</p>}>
      <ResourcesTable
        categories={typedCategories}
        assets={assets}
        signedUrlMap={signedUrlMap}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        initialQuery={q}
        initialCategory={categorySlug ?? "all"}
        initialStatus={status}
        initialSort={sort}
      />
    </Suspense>
  );
}
