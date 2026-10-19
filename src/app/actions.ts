"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { getCachedPreviewUrl } from "@/lib/signed-url-cache";

// Full-resolution files are never baked into the public page's initial payload —
// only fetched on demand when a visitor actually opens the viewer for a specific
// published asset. Keeps a page load from handing out every asset's file URL at once.
export async function getPublishedAssetUrl(assetId: string): Promise<{ url: string } | { error: string }> {
  const supabase = createPublicClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("storage_path, source_url")
    .eq("id", assetId)
    .eq("status", "published")
    .single();

  if (!asset) return { error: "Not found." };
  if (asset.source_url) return { url: asset.source_url };
  if (!asset.storage_path) return { error: "File not available." };

  const url = await getCachedPreviewUrl(asset.storage_path);
  if (!url) return { error: "Could not generate a link for this file." };
  return { url };
}
