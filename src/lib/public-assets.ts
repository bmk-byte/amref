import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedThumbnailUrl } from "@/lib/signed-url-cache";
import type { Asset } from "@/lib/types";

export type PublicAsset = {
  id: string;
  title: string;
  description: string | null;
  credit: string | null;
  tags: string[];
  file_type: string | null;
  category_id: string;
  url: string | null;
  thumbnailUrl: string | null;
};

// Videos live on Google Drive, not in Supabase Storage: no signing needed,
// just an embeddable thumbnail derived straight from the share link's file id.
function driveThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600` : null;
}

// Only pre-signs what a grid actually needs to render previews: thumbnails,
// and the file itself for images. PDFs/videos/docs are NOT pre-signed here —
// their full file URL is only fetched on demand when a visitor opens the
// viewer for that specific item.
export async function toPublicAssets(
  supabase: SupabaseClient<any, any, any>,
  assets: Asset[]
): Promise<PublicAsset[]> {
  const paths = assets.flatMap((a) => {
    const p: string[] = [];
    if (a.thumbnail_path) p.push(a.thumbnail_path);
    if (a.file_type?.startsWith("image/") && a.storage_path) p.push(a.storage_path);
    return p;
  });

  const signedUrlEntries = await Promise.all(
    paths.map(async (p) => [p, await getCachedThumbnailUrl(p)] as const)
  );
  const signedUrlMap = new Map(
    signedUrlEntries.filter((entry): entry is [string, string] => entry[1] !== null)
  );

  return assets.map((a) => {
    const isImage = a.file_type?.startsWith("image/");
    const isEmbedVideo = a.file_type === "video/external";
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      credit: a.credit,
      tags: a.tags,
      file_type: a.file_type,
      category_id: a.category_id,
      url: isImage
        ? (a.storage_path && signedUrlMap.get(a.storage_path)) || null
        : isEmbedVideo
          ? a.source_url
          : null,
      thumbnailUrl: a.thumbnail_path
        ? signedUrlMap.get(a.thumbnail_path) ?? null
        : isEmbedVideo
          ? driveThumbnail(a.source_url)
          : null,
    };
  });
}
