"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAsset } from "./actions";
import type { Category } from "@/lib/types";

export default function UploadForm({
  categories,
  notify,
}: {
  categories: Category[];
  notify: (type: "success" | "error", text: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadAsset(formData);
      if (result?.error) {
        notify("error", result.error);
      } else {
        notify("success", "Uploaded.");
        formRef.current?.reset();
        setFileName(null);
      }
    });
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      setFileName(file.name);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mb-8 grid gap-3 rounded-lg border border-black/10 bg-white p-5 sm:grid-cols-2"
    >
      <h2 className="col-span-full text-sm font-semibold text-brand-black">Upload a new asset</h2>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center text-sm transition ${
          dragOver ? "border-brand-orange bg-brand-orange/5" : "border-black/15 hover:border-brand-orange/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="mb-1 font-medium text-black/70">File</span>
        <span className="text-xs text-black/50">
          {fileName ?? "Drag and drop, or click to choose a file"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp,image/gif,video/mp4"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-black/70">Category</span>
        <select
          name="category_id"
          required
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-black/70">Title</span>
        <input
          type="text"
          name="title"
          required
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-black/70">Credit / photographer</span>
        <input name="credit" className="w-full rounded border border-black/15 px-3 py-2 text-sm" />
      </label>

      <label className="col-span-full text-sm">
        <span className="mb-1 block text-black/70">Description / caption</span>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </label>

      <label className="col-span-full text-sm">
        <span className="mb-1 block text-black/70">Tags (comma-separated)</span>
        <input name="tags" className="w-full rounded border border-black/15 px-3 py-2 text-sm" />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="col-span-full w-fit rounded bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
