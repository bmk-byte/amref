"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAsset } from "./actions";
import type { Category } from "@/lib/types";

export default function UploadForm({ categories }: { categories: Category[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadAsset(formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Uploaded." });
        formRef.current?.reset();
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mb-8 grid gap-3 rounded-lg border border-black/10 bg-white p-5 sm:grid-cols-2"
    >
      <h2 className="col-span-full text-sm font-semibold text-brand-black">Upload a new asset</h2>

      {message && (
        <p
          className={`col-span-full rounded px-3 py-2 text-sm ${
            message.type === "error"
              ? "border border-brand-red/30 bg-brand-red/5 text-brand-red"
              : "border border-green-300 bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <label className="text-sm">
        <span className="mb-1 block text-black/70">File</span>
        <input type="file" name="file" required className="w-full text-sm" />
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
        className="col-span-full w-fit rounded bg-brand-red px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
