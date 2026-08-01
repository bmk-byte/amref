"use client";

import { useState, useTransition } from "react";
import { deleteAsset, linkConsent, updateAssetStatus } from "./actions";
import type { Asset, AssetStatus, ConsentRecord } from "@/lib/types";

const STATUS_STYLES: Record<AssetStatus, string> = {
  draft: "bg-black/5 text-black/60",
  pending_consent: "bg-amber-100 text-amber-700",
  cleared: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-brand-red/10 text-brand-red",
};

export default function AssetRow({
  asset,
  requiresConsent,
  consentRecords,
  publicUrl,
}: {
  asset: Asset;
  requiresConsent: boolean;
  consentRecords: ConsentRecord[];
  publicUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(status: AssetStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateAssetStatus(asset.id, status);
      if (result?.error) setError(result.error);
    });
  }

  function handleConsentChange(consentId: string) {
    startTransition(async () => {
      await linkConsent(asset.id, consentId);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${asset.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteAsset(asset.id, asset.storage_path);
    });
  }

  return (
    <tr className="border-b border-black/5 align-top">
      <td className="py-3 pr-4">
        <div className="font-medium text-brand-black">{asset.title}</div>
        {asset.credit && <div className="text-xs text-black/50">Credit: {asset.credit}</div>}
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-red hover:underline"
          >
            View file
          </a>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[asset.status]}`}>
          {asset.status.replace("_", " ")}
        </span>
        {error && <div className="mt-1 max-w-[220px] text-xs text-brand-red">{error}</div>}
      </td>
      <td className="py-3 pr-4">
        {requiresConsent ? (
          <select
            defaultValue={asset.consent_id ?? ""}
            onChange={(e) => handleConsentChange(e.target.value)}
            className="rounded border border-black/15 px-2 py-1 text-xs"
          >
            <option value="">No consent linked</option>
            {consentRecords.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subject}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-black/40">Not required</span>
        )}
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-1">
          {(["draft", "pending_consent", "cleared", "published", "rejected"] as AssetStatus[]).map(
            (s) => (
              <button
                key={s}
                disabled={isPending || asset.status === s}
                onClick={() => handleStatusChange(s)}
                className="rounded border border-black/15 px-2 py-1 text-xs hover:border-brand-red hover:text-brand-red disabled:opacity-30"
              >
                {s === "published" ? "Publish" : s.replace("_", " ")}
              </button>
            )
          )}
          <button
            disabled={isPending}
            onClick={handleDelete}
            className="rounded border border-brand-red/30 px-2 py-1 text-xs text-brand-red hover:bg-brand-red/5"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
