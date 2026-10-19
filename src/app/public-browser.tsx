"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import type { PublicAsset } from "@/lib/public-assets";
import { getPublishedAssetUrl } from "./actions";

export function fileKind(fileType: string | null): "image" | "video" | "embed-video" | "pdf" | "doc" | "file" {
  if (!fileType) return "file";
  if (fileType === "video/external") return "embed-video";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.includes("pdf")) return "pdf";
  if (fileType.includes("word") || fileType.includes("document")) return "doc";
  return "file";
}

// Google Drive's share URL (…/file/d/ID/view) isn't embeddable directly —
// only its /preview variant renders inside an iframe.
function driveEmbedUrl(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}

function fileLabel(fileType: string | null): string {
  const kind = fileKind(fileType);
  if (kind === "pdf") return "PDF";
  if (kind === "doc") return "DOC";
  if (kind === "video" || kind === "embed-video") return "VIDEO";
  if (kind === "image") return "";
  return (fileType?.split("/")[1] ?? "FILE").toUpperCase().slice(0, 5);
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-brand-muted">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FileIcon() {
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

export function AssetCard({ asset, onOpen }: { asset: PublicAsset; onOpen: () => void }) {
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
          <Image
            src={asset.url}
            alt={asset.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            draggable={false}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : asset.thumbnailUrl ? (
          <>
            <Image
              src={asset.thumbnailUrl}
              alt={asset.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              draggable={false}
              className="object-cover object-top transition duration-300 group-hover:scale-105"
            />
            {fileLabel(asset.file_type) && (
              <span className="absolute right-2 top-2 rounded bg-neutral-950/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
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

export function AssetViewer({ asset, onClose }: { asset: PublicAsset; onClose: () => void }) {
  const kind = fileKind(asset.file_type);
  const needsFetch = kind !== "image" && kind !== "embed-video";

  const [url, setUrl] = useState<string | null>(asset.url);
  const [loading, setLoading] = useState(needsFetch);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [videoFrameLoaded, setVideoFrameLoaded] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 p-4"
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
            <div className="relative h-[75vh] w-full select-none">
              <Image src={url} alt={asset.title} fill draggable={false} className="object-contain" />
            </div>
          )}

          {!loading && !fetchError && url && kind === "pdf" && (
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              title={asset.title}
              className="h-[75vh] w-full"
            />
          )}

          {!loading && !fetchError && url && kind === "embed-video" && (
            <div className="relative h-[75vh] w-full">
              {!videoFrameLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-brand-muted">
                  Loading preview…
                </div>
              )}
              <iframe
                src={driveEmbedUrl(url)}
                title={asset.title}
                onLoad={() => setVideoFrameLoaded(true)}
                className={`h-full w-full transition-opacity duration-200 ${videoFrameLoaded ? "opacity-100" : "opacity-0"}`}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
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
  onOpenAsset,
}: {
  category: Category;
  assets: PublicAsset[];
  onOpenAsset: (asset: PublicAsset) => void;
}) {
  return (
    <section className="mb-14 scroll-mt-36">
      <div className="mb-5 flex items-baseline justify-between border-b border-brand-line pb-3">
        <h2 className="font-display text-xl font-semibold text-brand-black">{category.name}</h2>
        <Link href={`/browse/${category.slug}`} className="text-xs font-medium text-brand-orange hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onOpen={() => onOpenAsset(asset)} />
        ))}
      </div>
    </section>
  );
}

// Curated homepage view only: a bounded preview per category, each linking
// through to a full server-paginated/searchable view at /browse — not a
// client-side filterable grid itself. Search and category selection submit
// as real navigations into /browse instead of filtering in place, since the
// full dataset no longer lives in the browser (see /browse/[[...category]]).
export default function PublicBrowser({
  categories,
  assets,
}: {
  categories: Category[];
  assets: PublicAsset[];
}) {
  const [openAsset, setOpenAsset] = useState<PublicAsset | null>(null);

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-4 mb-10 border-b border-brand-line bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form action="/browse" className="relative w-full max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <SearchIcon />
            </span>
            <input
              type="search"
              name="q"
              placeholder="Search titles, descriptions, tags…"
              className="w-full rounded-full border border-brand-line bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-orange"
            />
          </form>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/browse"
              className="rounded-full border border-brand-line px-3.5 py-1.5 text-xs font-medium text-brand-muted transition-all duration-150 hover:border-brand-orange hover:text-brand-orange active:scale-90"
            >
              Browse all
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/browse/${c.slug}`}
                className="rounded-full border border-brand-line px-3.5 py-1.5 text-xs font-medium text-brand-muted transition-all duration-150 hover:border-brand-orange hover:text-brand-orange active:scale-90"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {categories.map((category) => {
        const categoryAssets = assets.filter((a) => a.category_id === category.id);
        if (categoryAssets.length === 0) return null;

        return (
          <CategorySection
            key={category.id}
            category={category}
            assets={categoryAssets}
            onOpenAsset={setOpenAsset}
          />
        );
      })}

      {assets.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FileIcon />
          <p className="text-sm text-brand-muted">No materials published yet.</p>
        </div>
      )}

      {openAsset && <AssetViewer asset={openAsset} onClose={() => setOpenAsset(null)} />}
    </div>
  );
}
