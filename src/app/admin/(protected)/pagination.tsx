"use client";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-xs text-black/50">
      <span>
        Showing {start}–{end} of {totalItems}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded border border-black/15 px-2.5 py-1 hover:border-brand-orange hover:text-brand-orange disabled:opacity-30"
          >
            Prev
          </button>
          <span className="px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded border border-black/15 px-2.5 py-1 hover:border-brand-orange hover:text-brand-orange disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
