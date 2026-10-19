import type { AssetStatus } from "@/lib/types";

const STATUS_STYLES: Record<AssetStatus, string> = {
  draft: "bg-black/5 text-black/60",
  pending_consent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  cleared: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  rejected: "bg-brand-orange/10 text-brand-orange",
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  draft: "Draft",
  pending_consent: "Pending consent",
  cleared: "Cleared",
  published: "Published",
  rejected: "Rejected",
};

export default function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
