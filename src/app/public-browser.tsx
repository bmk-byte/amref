"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Category } from "@/lib/types";
import { getPublishedAssetUrl } from "./actions";

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

function fileKind(fileType: string | null): "image" | "video" | "pdf" | "doc" | "file" {
  if (!fileType) return "file";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.includes("pdf")) return "pdf";
  if (fileType.includes("word") || fileType.includes("document")) return "doc";
  return "file";
}

function fileLabel(fileType: string | null): string {
  const kind = fileKind(fileType);
  if (kind === "pdf") return "PDF";
  if (kind === "doc") return "DOC";
  if (kind === "video") return "VIDEO";
  if (kind === "image") return "";
  return (fileType?.split("/")[1] ?? "FILE").toUpperCase().slice(0, 5);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-brand-muted">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-muted/50">
      <path
        d="M6 2.75h8.5L19 7.25V21a.75.75 0 0 1-.75.75H6A.75.75 0 0 1 5.25 21V3.5A.75.75 0 0 1 6 2.75Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M14 2.75V7.5h4.75" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

const PAGE_SIZE = 9;

function AssetCard({ asset, onOpen }: { asset: PublicAsset; onOpen: () => void }) {
  const kind = fileKind(asset.file_type);
  return (
    <button
      type="button"
      onClick={onOpen}
      onContextMenu={(e) => e.preventDefault()}
      className="group block w-full overflow-hidden rounded-xl border border-brand-line bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:border-brand-orange/40 hover:shadow-[0_12px_32px_-16px_rgba(24,20,15,0.25)]"
    >
      <div className="relative flex aspect-[4/3] select-none items-center justify-center overflow-hidden bg-brand-gray">
        {kind === "image" && asset.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : asset.thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.thumbnailUrl}
              alt={asset.title}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
            />
            {fileLabel(asset.file_type) && (
              <span className="absolute right-2 top-2 rounded bg-brand-black/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                {fileLabel(asset.file_type)}
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileIcon />
            {fileLabel(asset.file_type) && (
              <span className="text-[10px] font-semibold tracking-wider text-brand-muted/70">
                {fileLabel(asset.file_type)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-brand-black group-hover:text-brand-orange">
          {asset.title}
        </h3>
        {asset.description && (
          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-brand-muted">
            {asset.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {asset.credit ? (
            <p className="text-[11px] text-brand-muted/80">{asset.credit}</p>
          ) : (
            <span />
          )}
          {asset.tags.length > 0 && (
            <span className="text-[11px] text-brand-muted/60">{asset.tags.slice(0, 2).join(", ")}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function AssetViewer({ asset, onClose }: { asset: PublicAsset; onClose: () => void }) {
  const kind = fileKind(asset.file_type);
  const needsFetch = kind !== "image";

  const [url, setUrl] = useState<string | null>(asset.url);
  const [loading, setLoading] = useState(needsFetch);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    getPublishedAssetUrl(asset.id).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if ("error" in result) setFetchError(result.error);
      else setUrl(result.url);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") e.preventDefault();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
          <h3 className="line-clamp-1 pr-4 text-sm font-semibold text-brand-black">{asset.title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-brand-muted hover:text-brand-orange"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 select-none overflow-auto bg-brand-gray">
          {loading && (
            <div className="flex h-[50vh] items-center justify-center text-sm text-brand-muted">
              Loading…
            </div>
          )}

          {!loading && fetchError && (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-2 text-center">
              <FileIcon />
              <p className="text-sm text-brand-muted">{fetchError}</p>
            </div>
          )}

          {!loading && !fetchError && url && kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={asset.title}
              draggable={false}
              className="mx-auto max-h-[75vh] w-auto select-none"
            />
          )}

          {!loading && !fetchError && url && kind === "pdf" && (
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              title={asset.title}
              className="h-[75vh] w-full"
            />
          )}

          {!loading && !fetchError && url && kind === "video" && (
            <video
              src={url}
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="mx-auto max-h-[75vh] w-full"
            />
          )}

          {!loading && !fetchError && (kind === "doc" || kind === "file") && (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-2 p-10 text-center">
              <FileIcon />
              <p className="text-sm text-brand-muted">
                Preview not available for this file type. Contact the Amref Uganda Communications
                Unit for access.
              </p>
            </div>
          )}
        </div>

        {(asset.description || asset.credit) && (
          <div className="border-t border-brand-line px-4 py-3">
            {asset.description && (
              <p className="text-xs leading-relaxed text-brand-muted">{asset.description}</p>
            )}
            {asset.credit && (
              <p className="mt-1 text-[11px] text-brand-muted/80">Credit: {asset.credit}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySection({
  category,
  assets,
  capped,
  onOpenAsset,
}: {
  category: Category;
  assets: PublicAsset[];
  capped: boolean;
  onOpenAsset: (asset: PublicAsset) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldCap = capped && !expanded && assets.length > PAGE_SIZE;
  const visible = shouldCap ? assets.slice(0, PAGE_SIZE) : assets;

  return (
    <section id={category.slug} className="mb-14 scroll-mt-36">
      <div className="mb-5 flex items-baseline justify-between border-b border-brand-line pb-3">
        <h2 className="font-display text-xl font-semibold text-brand-black">{category.name}</h2>
        <span className="text-xs text-brand-muted">{assets.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onOpen={() => onOpenAsset(asset)} />
        ))}
      </div>
      {capped && assets.length > PAGE_SIZE && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-5 rounded-full border border-brand-line px-4 py-1.5 text-xs font-medium text-brand-muted transition-all hover:border-brand-orange hover:text-brand-orange active:scale-95"
        >
          {expanded ? "Show fewer" : `Show all ${assets.length}`}
        </button>
      )}
    </section>
  );
}

export default function PublicBrowser({
  categories,
  assets,
}: {
  categories: Category[];
  assets: PublicAsset[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [openAsset, setOpenAsset] = useState<PublicAsset | null>(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return assets.filter((a) => {
      if (activeCategory !== "all" && a.category_id !== activeCategory) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [assets, deferredQuery, activeCategory]);

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-4 mb-10 border-b border-brand-line bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="Search titles, descriptions, tags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-brand-line bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-orange"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              aria-pressed={activeCategory === "all"}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-90 ${
                activeCategory === "all"
                  ? "border-brand-orange bg-brand-orange text-white shadow-sm shadow-brand-orange/30"
                  : "border-brand-line text-brand-muted hover:border-brand-orange hover:text-brand-orange"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                aria-pressed={activeCategory === c.id}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-90 ${
                  activeCategory === c.id
                    ? "border-brand-orange bg-brand-orange text-white shadow-sm shadow-brand-orange/30"
                    : "border-brand-line text-brand-muted hover:border-brand-orange hover:text-brand-orange"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-brand-muted" aria-live="polite">
          Showing {filtered.length} of {assets.length} item{assets.length === 1 ? "" : "s"}
          {activeCategory !== "all"
            ? ` in ${categories.find((c) => c.id === activeCategory)?.name ?? ""}`
            : ""}
          {query ? ` matching “${query}”` : ""}
        </p>
      </div>

      {categories.map((category) => {
        const categoryAssets = filtered.filter((a) => a.category_id === category.id);
        if (categoryAssets.length === 0) return null;

        return (
          <CategorySection
            key={category.id}
            category={category}
            assets={categoryAssets}
            capped={!query}
            onOpenAsset={setOpenAsset}
          />
        );
      })}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FileIcon />
          <p className="text-sm text-brand-muted">No materials match your search.</p>
        </div>
      )}

      {openAsset && <AssetViewer asset={openAsset} onClose={() => setOpenAsset(null)} />}
    </div>
  );
}
