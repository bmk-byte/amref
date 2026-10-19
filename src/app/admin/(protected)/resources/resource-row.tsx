"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deleteAsset, updateAssetStatus } from "../actions";
import type { Asset, AssetStatus } from "@/lib/types";
import StatusBadge from "../status-badge";

function fileKindLabel(fileType: string | null): string {
  if (!fileType) return "FILE";
  if (fileType === "video/external") return "VIDEO";
  if (fileType.startsWith("image/")) return "IMG";
  if (fileType.includes("pdf")) return "PDF";
  return "FILE";
}

export default function ResourceRow({
  asset,
  categoryName,
  publicUrl,
  selected,
  onToggleSelect,
  externalError,
  notify,
}: {
  asset: Asset;
  categoryName: string;
  publicUrl: string | null;
  selected: boolean;
  onToggleSelect: () => void;
  externalError?: string;
  notify: (type: "success" | "error", text: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setError(externalError ?? null);
  }, [externalError]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggleMenu() {
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 });
    }
    setMenuOpen((v) => !v);
  }

  function handleStatusChange(status: AssetStatus) {
    setError(null);
    setMenuOpen(false);
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

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    setMenuOpen(false);
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
    <tr className="border-b border-black/5 align-top transition hover:bg-brand-gray/40">
      <td className="py-4 pl-4 pr-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={asset.status === "published"}
          aria-label={`Select ${asset.title}`}
        />
      </td>
      <td className="py-4 pr-4">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-black/50">
            {fileKindLabel(asset.file_type)}
          </span>
          <div className="min-w-0">
            <div className="font-medium text-brand-black">{asset.title}</div>
            {asset.tags.length > 0 && (
              <div className="mt-0.5 truncate text-xs text-black/40">{asset.tags.join(", ")}</div>
            )}
            {error && <div className="mt-1 max-w-[280px] text-xs text-brand-orange">{error}</div>}
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 text-sm text-black/60">{categoryName}</td>
      <td className="py-4 pr-4">
        <StatusBadge status={asset.status} />
      </td>
      <td className="py-4 pr-4 whitespace-nowrap text-xs text-black/40">
        {new Date(asset.updated_at).toLocaleDateString()}
      </td>
      <td className="py-4 pr-4">
        <div className="relative flex items-center justify-end gap-1.5" ref={menuRef}>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-black/15 px-2 py-1 text-xs hover:border-brand-orange hover:text-brand-orange"
            >
              View
            </a>
          )}
          {asset.status !== "published" && (
            <button
              disabled={isPending}
              onClick={() => handleStatusChange("published")}
              className="rounded bg-brand-orange px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          <button
            ref={buttonRef}
            disabled={isPending}
            onClick={toggleMenu}
            aria-label="More actions"
            aria-expanded={menuOpen}
            className="rounded border border-black/15 px-2 py-1 text-xs hover:border-brand-orange hover:text-brand-orange"
          >
            ⋯
          </button>
          {menuOpen &&
            menuPos &&
            createPortal(
              <div
                ref={menuRef}
                style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
                className="z-50 w-44 rounded-lg border border-brand-line bg-white p-1 shadow-[0_12px_32px_-12px_rgba(24,20,15,0.35)]"
              >
              {asset.status !== "draft" && (
                <button
                  onClick={() => handleStatusChange("draft")}
                  className="block w-full rounded px-2.5 py-1.5 text-left text-xs text-brand-black hover:bg-brand-gray"
                >
                  Set to draft
                </button>
              )}
              {asset.status !== "rejected" && (
                <button
                  onClick={() => handleStatusChange("rejected")}
                  className="block w-full rounded px-2.5 py-1.5 text-left text-xs text-brand-black hover:bg-brand-gray"
                >
                  Reject
                </button>
              )}
              {!confirmingDelete ? (
                <button
                  onClick={handleDeleteClick}
                  className="block w-full rounded px-2.5 py-1.5 text-left text-xs text-brand-orange hover:bg-brand-orange/5"
                >
                  Delete
                </button>
              ) : (
                <div className="px-2.5 py-1.5">
                  <p className="mb-1.5 text-xs text-brand-orange">Delete permanently?</p>
                  <div className="flex gap-1">
                    <button
                      onClick={handleDeleteClick}
                      className="rounded bg-brand-orange px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded border border-black/15 px-2 py-1 text-xs hover:border-black/30"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              </div>,
              document.body
            )}
        </div>
      </td>
    </tr>
  );
}
