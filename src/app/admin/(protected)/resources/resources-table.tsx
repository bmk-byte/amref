"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Asset, AssetStatus, Category } from "@/lib/types";
import ResourceRow from "./resource-row";
import Pagination from "../pagination";
import { publishAsset } from "../actions";
import { ToastStack, type ToastMessage } from "../toast";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_consent", label: "Pending consent" },
  { value: "cleared", label: "Cleared" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

export default function ResourcesTable({
  categories,
  assets,
  signedUrlMap,
}: {
  categories: Category[];
  assets: Asset[];
  signedUrlMap: Record<string, string>;
}) {
  const searchParams = useSearchParams();

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);
  const notify = useCallback((type: "success" | "error", text: string) => {
    const id = String(toastIdRef.current++);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get("category") ?? "all");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "all");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") ?? "1") || 1));
  const deferredQuery = useDeferredValue(query);

  // Reflect filter state in the address bar via the History API directly —
  // not next/navigation's router, which would trigger a server round-trip
  // (an RSC refetch) on every keystroke. This keeps filtering instant while
  // still making the URL shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sort !== "newest") params.set("sort", sort);
    if (page !== 1) params.set("page", String(page));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/admin/resources?${qs}` : "/admin/resources");
  }, [query, categoryFilter, statusFilter, sort, page]);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setPage(1);
  }, [deferredQuery, categoryFilter, statusFilter, sort]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = assets.filter((a) => {
      if (categoryFilter !== "all" && categoryMap.get(a.category_id)?.slug !== categoryFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "oldest") return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [assets, deferredQuery, categoryFilter, statusFilter, sort, categoryMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const publishable = pageItems.filter((a) => a.status !== "published");
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
      notify("success", `Published ${succeeded} item${succeeded === 1 ? "" : "s"}.`);
    } else {
      notify("error", `Published ${succeeded}, failed ${failed}: ${failedTitles.join(", ")}`);
    }
  }

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSort("newest");
    setPage(1);
  }

  const hasFilters = query !== "" || categoryFilter !== "all" || statusFilter !== "all" || sort !== "newest";

  return (
    <div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-black">All Resources</h1>
          <p className="mt-1 text-sm text-black/60">
            Search, filter, and manage every resource in the library.
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="shrink-0 rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Add Resource
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles or tags…"
          className="w-full max-w-xs rounded-full border border-black/15 px-4 py-1.5 text-sm outline-none focus:border-brand-orange"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded border border-black/15 px-2 py-1.5 text-sm"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-black/15 px-2 py-1.5 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded border border-black/15 px-2 py-1.5 text-sm"
          aria-label="Sort order"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-black/50 hover:text-brand-orange">
            Clear filters
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-black/50">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </span>
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

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-black/50">
              <th className="py-3 pl-4 pr-2 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={publishable.length === 0}
                  aria-label="Select all on this page"
                />
              </th>
              <th className="py-3 pr-4 font-medium">Resource</th>
              <th className="py-3 pr-4 font-medium">Category</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Updated</th>
              <th className="py-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((asset) => (
              <ResourceRow
                key={asset.id}
                asset={asset}
                categoryName={categoryMap.get(asset.category_id)?.name ?? "—"}
                publicUrl={asset.storage_path ? signedUrlMap[asset.storage_path] ?? null : asset.source_url}
                selected={selected.has(asset.id)}
                onToggleSelect={() => toggleOne(asset.id)}
                externalError={rowErrors[asset.id]}
                notify={notify}
              />
            ))}
          </tbody>
        </table>
        {pageItems.length === 0 && (
          <p className="p-8 text-center text-sm text-black/40">No resources match your filters.</p>
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
