"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { listPublishedAssets } from "@/lib/queries/assets";
import { toPublicAssets, type PublicAsset } from "@/lib/public-assets";

const PAGE_LIMIT = 24;

export async function loadMoreAssets(params: {
  q?: string;
  categorySlug?: string;
  cursor: string | null;
}): Promise<{ assets: PublicAsset[]; nextCursor: string | null }> {
  const supabase = createPublicClient();
  const { assets, nextCursor } = await listPublishedAssets(supabase, {
    q: params.q,
    categorySlug: params.categorySlug,
    cursor: params.cursor,
    limit: PAGE_LIMIT,
  });
  const publicAssets = await toPublicAssets(supabase, assets);
  return { assets: publicAssets, nextCursor };
}
