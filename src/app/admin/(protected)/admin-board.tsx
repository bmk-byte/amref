"use client";

import { useCallback, useRef, useState } from "react";
import { CATEGORIES_REQUIRING_CONSENT, type Asset, type Category, type ConsentRecord } from "@/lib/types";
import AssetRow from "./asset-row";
import { publishAsset } from "./actions";
import { ToastStack, type ToastMessage } from "./toast";

type Notify = (type: "success" | "error", text: string) => void;

export default function AdminBoard({
  categories,
  assets,
  consentRecords,
  signedUrlMap,
}: {
  categories: Category[];
  assets: Asset[];
  consentRecords: ConsentRecord[];
  signedUrlMap: Record<string, string>;
}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const notify = useCallback<Notify>((type, text) => {
    const id = String(toastIdRef.current++);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {categories.map((category) => {
        const categoryAssets = assets.filter((a) => a.category_id === category.id);
        if (categoryAssets.length === 0) return null;
        const requiresConsent = CATEGORIES_REQUIRING_CONSENT.includes(category.slug);

        return (
          <CategorySection
            key={category.id}
            category={category}
            assets={categoryAssets}
            requiresConsent={requiresConsent}
            consentRecords={consentRecords}
            signedUrlMap={signedUrlMap}
            notify={notify}
          />
        );
      })}

      {assets.length === 0 && <p className="text-sm text-black/50">No assets uploaded yet.</p>}
    </div>
  );
}

function CategorySection({
  category,
  assets,
  requiresConsent,
  consentRecords,
  signedUrlMap,
  notify,
}: {
  category: Category;
  assets: Asset[];
  requiresConsent: boolean;
  consentRecords: ConsentRecord[];
  signedUrlMap: Record<string, string>;
  notify: Notify;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const publishable = assets.filter((a) => a.status !== "published");
  const allSelected = publishable.length > 0 && publishable.every((a) => selected.has(a.id));

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
    <div className="mb-8">
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
            className="rounded bg-brand-red px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-30"
          >
            Publish selected
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[760px] text-sm">
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
              <th className="px-4 py-2 font-medium">Consent</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                requiresConsent={requiresConsent}
                consentRecords={consentRecords}
                publicUrl={signedUrlMap[asset.storage_path] ?? null}
                selected={selected.has(asset.id)}
                onToggleSelect={() => toggleOne(asset.id)}
                externalError={rowErrors[asset.id]}
                notify={notify}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
