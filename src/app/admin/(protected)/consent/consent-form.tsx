"use client";

import { useRef, useState, useTransition } from "react";
import { createConsentRecord } from "../actions";

export default function ConsentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createConsentRecord(formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Consent record saved." });
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
      <h2 className="col-span-full text-sm font-semibold text-brand-black">Add a consent record</h2>

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
        <span className="mb-1 block text-black/70">Subject (name / description)</span>
        <input
          name="subject"
          required
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-black/70">Date signed</span>
        <input
          type="date"
          name="date_signed"
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </label>

      <label className="col-span-full text-sm">
        <span className="mb-1 block text-black/70">Scope (what they consented to)</span>
        <textarea
          name="scope"
          rows={2}
          className="w-full rounded border border-black/15 px-3 py-2 text-sm"
        />
      </label>

      <label className="col-span-full text-sm">
        <span className="mb-1 block text-black/70">Signed consent form (scan/photo, optional)</span>
        <input type="file" name="form_file" className="w-full text-sm" />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="col-span-full w-fit rounded bg-brand-red px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save consent record"}
      </button>
    </form>
  );
}
