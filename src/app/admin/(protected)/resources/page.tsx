import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Asset, Category } from "@/lib/types";
import ResourcesTable from "./resources-table";

export default async function ResourcesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: assets }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("assets")
      .select("*, categories(id, slug, name, sort_order)")
      .order("created_at", { ascending: false }),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedAssets = (assets ?? []) as Asset[];

  const paths = typedAssets.map((a) => a.storage_path).filter((p): p is string => !!p);
  const signedUrlMap: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from("h4gt-assets").createSignedUrls(paths, 3600);
    for (const s of signedUrls ?? []) {
      if (s.path && s.signedUrl) signedUrlMap[s.path] = s.signedUrl;
    }
  }

  return (
    <Suspense fallback={<p className="text-sm text-black/50">Loading…</p>}>
      <ResourcesTable categories={typedCategories} assets={typedAssets} signedUrlMap={signedUrlMap} />
    </Suspense>
  );
}
