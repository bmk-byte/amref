"use server";

import { createPublicClient } from "@/lib/supabase/public";

// Full-resolution files are never baked into the public page's initial payload —
// only fetched on demand when a visitor actually opens the viewer for a specific
// published asset. Keeps a page load from handing out every asset's file URL at once.
export async function getPublishedAssetUrl(assetId: string): Promise<{ url: string } | { error: string }> {
  const supabase = createPublicClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("id", assetId)
    .eq("status", "published")
    .single();

  if (!asset) return { error: "Not found." };

  const { data, error } = await supabase.storage
    .from("h4gt-assets")
    .createSignedUrl(asset.storage_path, 300);

  if (error || !data?.signedUrl) {
    if (error) console.error(error);
    return { error: "Could not generate a link for this file." };
  }
  return { url: data.signedUrl };
}
