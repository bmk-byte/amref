import type { SupabaseClient } from "@supabase/supabase-js";
import type { Asset, AssetStatus, Category } from "@/lib/types";

type AnyClient = SupabaseClient<any, any, any>;

// --- search term handling ---------------------------------------------------

// Strip characters that are syntactically significant inside PostgREST's
// .or() filter-string grammar (*, comma, parens, quotes, backslash) instead
// of trying to exactly replicate its escaping rules — free-text search input
// has no real need for any of these literally.
function escapeSearchTerm(raw: string): string {
  return raw.replace(/[*,()"\\]/g, "").trim();
}

// Escape real ILIKE metacharacters so substring search stays literal (a
// search for "100%" or "a_b" must not behave like a wildcard), then wrap in
// '*' — PostgREST's stand-in for '%' inside .or() filter strings.
function ilikePattern(term: string): string {
  const escaped = term.replace(/%/g, "\\%").replace(/_/g, "\\_");
  return `*${escaped}*`;
}

export function adminSearchFilter(term: string): string {
  const t = ilikePattern(escapeSearchTerm(term));
  return `title.ilike.${t},tags_text.ilike.${t}`;
}

export function publicSearchFilter(term: string): string {
  const t = ilikePattern(escapeSearchTerm(term));
  return `title.ilike.${t},description.ilike.${t},tags_text.ilike.${t}`;
}

// --- cursor handling (public keyset pagination) -----------------------------

export type AssetCursor = { created_at: string; id: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(\+\d{2}:\d{2}|Z)$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(cursor: AssetCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

// Validates shape before anything downstream trusts it — this is what makes
// it safe to interpolate created_at/id directly into a keyset .or() clause;
// a tampered cursor is rejected here, not used to inject extra filters.
export function decodeCursor(raw: string | undefined | null): AssetCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.created_at === "string" &&
      typeof parsed.id === "string" &&
      ISO_DATE_RE.test(parsed.created_at) &&
      UUID_RE.test(parsed.id)
    ) {
      return { created_at: parsed.created_at, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

// --- shared column selections ------------------------------------------------

const PUBLIC_ASSET_COLUMNS =
  "id, title, description, credit, tags, file_type, category_id, storage_path, thumbnail_path, source_url, created_at, updated_at";

async function resolveCategoryId(supabase: AnyClient, slug: string): Promise<string | null> {
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

// --- admin: offset pagination -------------------------------------------------

export type AdminSort = "newest" | "oldest" | "title";

export async function listAssetsAdmin(
  supabase: AnyClient,
  params: {
    q?: string;
    categorySlug?: string;
    status?: AssetStatus | "all";
    sort?: AdminSort;
    page: number;
    pageSize: number;
  }
): Promise<{ assets: Asset[]; totalCount: number }> {
  const { q, categorySlug, status, sort = "newest", page, pageSize } = params;

  let categoryId: string | null = null;
  if (categorySlug) {
    categoryId = await resolveCategoryId(supabase, categorySlug);
    if (!categoryId) return { assets: [], totalCount: 0 };
  }

  let query = supabase
    .from("assets")
    .select("*, categories(id, slug, name, sort_order)", { count: "estimated" });

  if (status && status !== "all") query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (q && q.trim()) query = query.or(adminSearchFilter(q));

  if (sort === "title") query = query.order("title", { ascending: true });
  else if (sort === "oldest") query = query.order("updated_at", { ascending: true });
  else query = query.order("updated_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count } = await query.range(from, to);

  return { assets: (data ?? []) as Asset[], totalCount: count ?? 0 };
}

// --- public: keyset ("Load more") pagination ----------------------------------

export async function listPublishedAssets(
  supabase: AnyClient,
  params: { q?: string; categorySlug?: string; cursor?: string | null; limit: number }
): Promise<{ assets: Asset[]; nextCursor: string | null }> {
  const { q, categorySlug, cursor, limit } = params;

  let categoryId: string | null = null;
  if (categorySlug) {
    categoryId = await resolveCategoryId(supabase, categorySlug);
    if (!categoryId) return { assets: [], nextCursor: null };
  }

  let query = supabase
    .from("assets")
    .select(PUBLIC_ASSET_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (q && q.trim()) query = query.or(publicSearchFilter(q));

  const decoded = decodeCursor(cursor);
  if (decoded) {
    query = query.or(
      `created_at.lt.${decoded.created_at},and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`
    );
  }

  const { data } = await query;
  const assets = (data ?? []) as Asset[];
  const last = assets[assets.length - 1];
  const nextCursor =
    assets.length === limit && last ? encodeCursor({ created_at: last.created_at, id: last.id }) : null;

  return { assets, nextCursor };
}

// --- public: bounded per-category homepage previews ---------------------------

export async function listHomepagePreviews(
  supabase: AnyClient,
  categories: Category[],
  perCategory: number
): Promise<Map<string, Asset[]>> {
  const results = await Promise.all(
    categories.map((c) =>
      supabase
        .from("assets")
        .select(PUBLIC_ASSET_COLUMNS)
        .eq("status", "published")
        .eq("category_id", c.id)
        .order("created_at", { ascending: false })
        .limit(perCategory)
    )
  );

  const map = new Map<string, Asset[]>();
  categories.forEach((c, i) => {
    map.set(c.id, (results[i].data ?? []) as Asset[]);
  });
  return map;
}
