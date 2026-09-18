"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES_REQUIRING_CONSENT, type AssetStatus } from "@/lib/types";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Office formats (Word/Excel/PowerPoint) are deliberately excluded: the public
// viewer can't preview them (falls back to "Preview not available"), so the
// house rule is PDF for every document — convert before uploading.
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

async function generatePdfThumbnail(file: File): Promise<Buffer | null> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getScreenshot({ partial: [1], desiredWidth: 600 });
    await parser.destroy();
    return Buffer.from(result.pages[0].data);
  } catch {
    return null;
  }
}

export async function uploadAsset(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string)?.trim();
  const categoryId = formData.get("category_id") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const credit = (formData.get("credit") as string)?.trim() || null;
  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!file || file.size === 0) return { error: "A file is required." };
  if (!title) return { error: "A title is required." };
  if (!categoryId) return { error: "A category is required." };
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return {
      error: `File type "${file.type || "unknown"}" isn't allowed. Convert Word/Excel/PowerPoint files to PDF first — only PDF, image, or video files can be uploaded here.`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 25MB.` };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .single();
  if (!category) return { error: "Unknown category." };

  const path = `${category.slug}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("h4gt-assets").upload(path, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) {
    console.error(uploadError);
    return { error: uploadError.message };
  }

  let thumbnailPath: string | null = null;
  if (file.type === "application/pdf") {
    const thumbnail = await generatePdfThumbnail(file);
    if (thumbnail) {
      const thumbPath = `${category.slug}/thumbnails/${Date.now()}-${sanitizeFilename(file.name)}.png`;
      const { error: thumbError } = await supabase.storage
        .from("h4gt-assets")
        .upload(thumbPath, thumbnail, { contentType: "image/png" });
      if (!thumbError) thumbnailPath = thumbPath;
    }
  }

  const initialStatus: AssetStatus = CATEGORIES_REQUIRING_CONSENT.includes(category.slug)
    ? "pending_consent"
    : "draft";

  const { error: insertError } = await supabase.from("assets").insert({
    category_id: categoryId,
    title,
    description,
    storage_path: path,
    thumbnail_path: thumbnailPath,
    file_type: file.type || null,
    credit,
    tags,
    status: initialStatus,
    uploaded_by: user.id,
  });

  if (insertError) {
    console.error(insertError);
    return { error: insertError.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

const DRIVE_FILE_URL_RE = /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/(view|preview)/;

// Hot-linking drive.google.com/thumbnail on every page load makes the grid's
// load time depend on Google's endpoint. Fetching it once here and storing it
// in our own bucket puts video thumbnails on the same fast, reliable path as
// every other asset's thumbnail.
async function cacheDriveThumbnail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceUrl: string,
  categorySlug: string
): Promise<string | null> {
  const match = sourceUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const fileId = match[1];

  try {
    const res = await fetch(`https://drive.google.com/thumbnail?id=${fileId}&sz=w600`);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

    const thumbPath = `${categorySlug}/thumbnails/${Date.now()}-drive-${fileId}.jpg`;
    const { error } = await supabase.storage
      .from("h4gt-assets")
      .upload(thumbPath, buffer, { contentType: "image/jpeg" });
    if (error) return null;
    return thumbPath;
  } catch {
    return null;
  }
}

export async function addVideoLink(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = (formData.get("title") as string)?.trim();
  const categoryId = formData.get("category_id") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const credit = (formData.get("credit") as string)?.trim() || null;
  const sourceUrl = (formData.get("source_url") as string)?.trim();
  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!title) return { error: "A title is required." };
  if (!categoryId) return { error: "A category is required." };
  if (!sourceUrl) return { error: "A video link is required." };
  if (!DRIVE_FILE_URL_RE.test(sourceUrl)) {
    return { error: "Only Google Drive file links (https://drive.google.com/file/d/…) are supported." };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .single();
  if (!category) return { error: "Unknown category." };

  const initialStatus: AssetStatus = CATEGORIES_REQUIRING_CONSENT.includes(category.slug)
    ? "pending_consent"
    : "draft";

  const thumbnailPath = await cacheDriveThumbnail(supabase, sourceUrl, category.slug);

  const { error: insertError } = await supabase.from("assets").insert({
    category_id: categoryId,
    title,
    description,
    storage_path: null,
    source_url: sourceUrl,
    thumbnail_path: thumbnailPath,
    file_type: "video/external",
    credit,
    tags,
    status: initialStatus,
    uploaded_by: user.id,
  });

  if (insertError) {
    console.error(insertError);
    return { error: insertError.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateAssetStatus(assetId: string, status: AssetStatus) {
  const supabase = await createClient();

  if (status === "published") {
    return publishAsset(assetId);
  }

  const { error } = await supabase.from("assets").update({ status }).eq("id", assetId);
  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function publishAsset(assetId: string) {
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("id, consent_id, categories(slug), consent_records(status)")
    .eq("id", assetId)
    .single();

  if (!asset) return { error: "Asset not found." };

  const categorySlug = (asset.categories as unknown as { slug: string } | null)?.slug;
  const requiresConsent = categorySlug ? CATEGORIES_REQUIRING_CONSENT.includes(categorySlug) : false;
  const consentStatus = (asset.consent_records as unknown as { status: string } | null)?.status;

  if (requiresConsent && (!asset.consent_id || consentStatus !== "active")) {
    return {
      error:
        "Cannot publish: this category requires a linked, active consent record before the asset can go public.",
    };
  }

  const { error } = await supabase.from("assets").update({ status: "published" }).eq("id", assetId);
  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function linkConsent(assetId: string, consentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assets")
    .update({ consent_id: consentId || null })
    .eq("id", assetId);
  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteAsset(assetId: string, storagePath: string | null) {
  const supabase = await createClient();
  if (storagePath) {
    await supabase.storage.from("h4gt-assets").remove([storagePath]);
  }
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function createConsentRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const subject = (formData.get("subject") as string)?.trim();
  const scope = (formData.get("scope") as string)?.trim() || null;
  const dateSigned = (formData.get("date_signed") as string) || null;
  const file = formData.get("form_file") as File | null;

  if (!subject) return { error: "Subject is required." };

  let consentFormPath: string | null = null;
  if (file && file.size > 0) {
    const path = `${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("h4gt-consent-forms")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) {
      console.error(uploadError);
      return { error: uploadError.message };
    }
    consentFormPath = path;
  }

  const { error } = await supabase.from("consent_records").insert({
    subject,
    scope,
    date_signed: dateSigned,
    consent_form_path: consentFormPath,
    created_by: user.id,
  });
  if (error) {
    console.error(error);
    return { error: error.message };
  }

  revalidatePath("/admin/consent");
  return { success: true };
}
