"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteAsset, linkConsent, updateAssetStatus } from "./actions";
import type { Asset, AssetStatus, ConsentRecord } from "@/lib/types";

const STATUS_STYLES: Record<AssetStatus, string> = {
  draft: "bg-black/5 text-black/60",
  pending_consent: "bg-amber-100 text-amber-700",
  cleared: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-brand-orange/10 text-brand-orange",
};

export default function AssetRow({
  asset,
  requiresConsent,
  consentRecords,
  publicUrl,
  selected,
  onToggleSelect,
  externalError,
  notify,
}: {
  asset: Asset;
  requiresConsent: boolean;
  consentRecords: ConsentRecord[];
  publicUrl: string | null;
  selected: boolean;
  onToggleSelect: () => void;
  externalError?: string;
  notify: (type: "success" | "error", text: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setError(externalError ?? null);
  }, [externalError]);

  function handleStatusChange(status: AssetStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateAssetStatus(asset.id, status);
      if (result?.error) {
        setError(result.error);
        notify("error", `Failed to update "${asset.title}": ${result.error}`);
      } else {
        notify("success", `"${asset.title}" set to ${status.replace("_", " ")}.`);
      }
    });
  }

  function handleConsentChange(consentId: string) {
    startTransition(async () => {
      const result = await linkConsent(asset.id, consentId);
      if (result?.error) {
        notify("error", `Failed to link consent for "${asset.title}": ${result.error}`);
      } else {
        notify("success", `Consent updated for "${asset.title}".`);
      }
    });
  }

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    startTransition(async () => {
      const result = await deleteAsset(asset.id, asset.storage_path);
      if (result?.error) {
        notify("error", `Failed to delete "${asset.title}": ${result.error}`);
      } else {
        notify("success", `"${asset.title}" deleted.`);
      }
    });
  }

  return (
    <tr className="border-b border-black/5 align-top">
      <td className="py-3 pr-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={asset.status === "published"}
          aria-label={`Select ${asset.title}`}
        />
      </td>
      <td className="py-3 pr-4">
        <div className="font-medium text-brand-black">{asset.title}</div>
        {asset.credit && <div className="text-xs text-black/50">Credit: {asset.credit}</div>}
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-orange hover:underline"
          >
            View file
          </a>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[asset.status]}`}>
          {asset.status.replace("_", " ")}
        </span>
        {error && <div className="mt-1 max-w-[220px] text-xs text-brand-orange">{error}</div>}
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
        <div className="flex flex-wrap items-center gap-1">
          {(["draft", "pending_consent", "cleared", "published", "rejected"] as AssetStatus[]).map(
            (s) => (
              <button
                key={s}
                disabled={isPending || asset.status === s}
                onClick={() => handleStatusChange(s)}
                className="rounded border border-black/15 px-2 py-1 text-xs hover:border-brand-orange hover:text-brand-orange disabled:opacity-30"
              >
                {s === "published" ? "Publish" : s.replace("_", " ")}
              </button>
            )
          )}
          {!confirmingDelete ? (
            <button
              disabled={isPending}
              onClick={handleDeleteClick}
              className="rounded border border-brand-orange/30 px-2 py-1 text-xs text-brand-orange hover:bg-brand-orange/5"
            >
              Delete
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <span className="text-xs text-brand-orange">Delete?</span>
              <button
                disabled={isPending}
                onClick={handleDeleteClick}
                className="rounded bg-brand-orange px-2 py-1 text-xs font-medium text-white hover:opacity-90"
              >
                Confirm
              </button>
              <button
                disabled={isPending}
                onClick={() => setConfirmingDelete(false)}
                className="rounded border border-black/15 px-2 py-1 text-xs hover:border-black/30"
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
