"use client";

import { useRef, useTransition } from "react";
import { addVideoLink } from "./actions";
import type { Category } from "@/lib/types";

export default function VideoLinkForm({
  categories,
  notify,
}: {
  categories: Category[];
  notify: (type: "success" | "error", text: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addVideoLink(formData);
      if (result?.error) {
        notify("error", result.error);
      } else {
        notify("success", "Video link added.");
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
      <h2 className="col-span-full text-sm font-semibold text-brand-black">Add a video link</h2>
      <p className="col-span-full -mt-2 text-xs text-black/50">
        Paste a Google Drive share link (File → Share → Copy link). The file must be shared as
        &ldquo;Anyone with the link&rdquo; so visitors can preview it.
      </p>

      <label className="col-span-full text-sm">
        <span className="mb-1 block text-black/70">Google Drive link</span>
        <input
          type="url"
          name="source_url"
          required
          placeholder="https://drive.google.com/file/d/…/view?usp=sharing"
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
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
        <span className="mb-1 block text-black/70">Credit</span>
        <input name="credit" className="w-full rounded border border-black/15 px-3 py-2 text-sm" />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-black/70">Tags (comma-separated)</span>
        <input name="tags" className="w-full rounded border border-black/15 px-3 py-2 text-sm" />
      </label>

      <label className="col-span-full text-sm">
        <span className="mb-1 block text-black/70">Description / caption</span>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="col-span-full w-fit rounded bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add video link"}
      </button>
    </form>
  );
}
