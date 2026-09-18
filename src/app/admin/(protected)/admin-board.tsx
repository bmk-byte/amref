"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import type { Asset, AssetStatus, Category } from "@/lib/types";
import AssetRow from "./asset-row";
import UploadForm from "./upload-form";
import VideoLinkForm from "./video-link-form";
import { publishAsset } from "./actions";
import { ToastStack, type ToastMessage } from "./toast";

type Notify = (type: "success" | "error", text: string) => void;

const STATUS_FILTERS: { value: AssetStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_consent", label: "Pending consent" },
  { value: "cleared", label: "Cleared" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

const ROWS_PER_PAGE = 15;

export default function AdminBoard({
  categories,
  assets,
  signedUrlMap,
}: {
  categories: Category[];
  assets: Asset[];
  signedUrlMap: Record<string, string>;
}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const deferredQuery = useDeferredValue(query);

  const notify = useCallback<Notify>((type, text) => {
    const id = String(toastIdRef.current++);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const filteredAssets = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return assets.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
    });
  }, [assets, deferredQuery, statusFilter]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of filteredAssets) counts.set(a.category_id, (counts.get(a.category_id) ?? 0) + 1);
    return counts;
  }, [filteredAssets]);

  const visibleCategories = categories.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0);

  return (
    <div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <UploadForm categories={categories} notify={notify} />
      <VideoLinkForm categories={categories} notify={notify} />

      <div className="sticky top-0 z-10 mb-6 -mx-4 border-b border-black/10 bg-brand-gray/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles or tags…"
            className="w-full max-w-sm rounded-full border border-black/15 bg-white px-4 py-1.5 text-sm outline-none focus:border-brand-orange"
          />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  statusFilter === s.value
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-black/15 text-black/60 hover:border-brand-orange hover:text-brand-orange"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {visibleCategories.length > 1 && (
          <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {visibleCategories.map((c) => (
              <a key={c.id} href={`#${c.slug}`} className="text-black/50 hover:text-brand-orange">
                {c.name} <span className="text-black/30">({categoryCounts.get(c.id)})</span>
              </a>
            ))}
          </nav>
        )}
      </div>

      {visibleCategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          assets={filteredAssets.filter((a) => a.category_id === category.id)}
          signedUrlMap={signedUrlMap}
          notify={notify}
        />
      ))}

      {assets.length === 0 && <p className="text-sm text-black/50">No assets uploaded yet.</p>}
      {assets.length > 0 && filteredAssets.length === 0 && (
        <p className="text-sm text-black/50">No assets match your search/filter.</p>
      )}
    </div>
  );
}

function CategorySection({
  category,
  assets,
  signedUrlMap,
  notify,
}: {
  category: Category;
  assets: Asset[];
  signedUrlMap: Record<string, string>;
  notify: Notify;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  const publishable = assets.filter((a) => a.status !== "published");
  const allSelected = publishable.length > 0 && publishable.every((a) => selected.has(a.id));
  const visibleAssets = expanded ? assets : assets.slice(0, ROWS_PER_PAGE);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(publishable.map((a) => a.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkPublish() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setRowErrors({});
    setBulkProgress({ done: 0, total: ids.length });

    let succeeded = 0;
    let failed = 0;
    const failedTitles: string[] = [];

    for (const id of ids) {
      const asset = assets.find((a) => a.id === id);
      const result = await publishAsset(id);
      if (result?.error) {
        failed++;
        setRowErrors((prev) => ({ ...prev, [id]: result.error! }));
        if (asset) failedTitles.push(asset.title);
      } else {
        succeeded++;
      }
      setBulkProgress((prev) => (prev ? { done: prev.done + 1, total: prev.total } : prev));
    }

    setBulkProgress(null);
    setSelected(new Set());

    if (failed === 0) {
      notify("success", `Published ${succeeded} item${succeeded === 1 ? "" : "s"} in ${category.name}.`);
    } else {
      notify(
        "error",
        `Published ${succeeded}, failed ${failed} in ${category.name}: ${failedTitles.join(", ")}`
      );
    }
  }

  return (
    <div id={category.slug} className="mb-8 scroll-mt-32">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-brand-black">
          {category.name} <span className="font-normal text-black/40">({assets.length})</span>
        </h2>
        <div className="flex items-center gap-3">
          {selected.size > 0 && !bulkProgress && (
            <span className="text-xs text-black/50">{selected.size} selected</span>
          )}
          {bulkProgress && (
            <span className="text-xs text-black/50">
              Publishing {bulkProgress.done}/{bulkProgress.total}…
            </span>
          )}
          <button
            type="button"
            disabled={selected.size === 0 || !!bulkProgress}
            onClick={handleBulkPublish}
            className="rounded bg-brand-orange px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-30"
          >
            Publish selected
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-black/50">
              <th className="px-4 py-2 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={publishable.length === 0}
                  aria-label="Select all publishable assets"
                />
              </th>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleAssets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                publicUrl={
                  asset.storage_path ? signedUrlMap[asset.storage_path] ?? null : asset.source_url
                }
                selected={selected.has(asset.id)}
                onToggleSelect={() => toggleOne(asset.id)}
                externalError={rowErrors[asset.id]}
                notify={notify}
              />
            ))}
          </tbody>
        </table>
      </div>
      {assets.length > ROWS_PER_PAGE && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium text-black/60 transition-all hover:border-brand-orange hover:text-brand-orange"
        >
          {expanded ? "Show fewer" : `Show all ${assets.length}`}
        </button>
      )}
    </div>
  );
}
