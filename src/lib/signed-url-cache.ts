import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

async function mintSignedUrl(path: string, expiresIn: number): Promise<string | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.storage
    .from("h4gt-assets")
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// Storage paths are immutable once uploaded (Date.now()-prefixed filenames), so
// a signed URL for a given path never goes stale from content changes — only
// from its own expiry. Caching it server-side keeps the URL embedded in
// rendered pages stable across ISR revalidations instead of rotating on every
// render, which otherwise defeats browser/CDN caching of the same image bytes.
const THUMBNAIL_URL_TTL = 60 * 60 * 24 * 7; // 7 days
const PREVIEW_URL_TTL = 300; // 5 minutes — matches the original short-lived-link intent for full files

export const getCachedThumbnailUrl = unstable_cache(
  (path: string) => mintSignedUrl(path, THUMBNAIL_URL_TTL),
  ["h4gt-thumbnail-signed-url"],
  { revalidate: THUMBNAIL_URL_TTL - 3600 }
);

export const getCachedPreviewUrl = unstable_cache(
  (path: string) => mintSignedUrl(path, PREVIEW_URL_TTL),
  ["h4gt-preview-signed-url"],
  { revalidate: PREVIEW_URL_TTL - 30 }
);
