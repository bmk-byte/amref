"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";
import UploadForm from "../../upload-form";
import VideoLinkForm from "../../video-link-form";
import { ToastStack, type ToastMessage } from "../../toast";

export default function AddResourceView({ categories }: { categories: Category[] }) {
  const [tab, setTab] = useState<"file" | "link">("file");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  function notify(type: "success" | "error", text: string) {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    if (type === "success") setLastSuccess(text);
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-black">Add Resource</h1>
        <p className="mt-1 text-sm text-black/60">
          Upload a file, or register a Google Drive video link. New resources start as drafts.
        </p>
      </div>

      {lastSuccess && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/60 dark:text-green-400">
          <span>{lastSuccess}</span>
          <Link href="/admin/resources" className="shrink-0 font-medium underline hover:no-underline">
            View in resources →
          </Link>
        </div>
      )}

      <div className="mb-4 inline-flex rounded-full border border-black/10 bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("file")}
          className={`rounded-full px-4 py-1.5 transition ${
            tab === "file" ? "bg-brand-orange text-white" : "text-black/60 hover:text-brand-orange"
          }`}
        >
          Upload a file
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`rounded-full px-4 py-1.5 transition ${
            tab === "link" ? "bg-brand-orange text-white" : "text-black/60 hover:text-brand-orange"
          }`}
        >
          Add a video link
        </button>
      </div>

      <div className="max-w-2xl">
        {tab === "file" ? (
          <UploadForm categories={categories} notify={notify} />
        ) : (
          <VideoLinkForm categories={categories} notify={notify} />
        )}
      </div>
    </div>
  );
}
