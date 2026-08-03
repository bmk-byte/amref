"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-base font-semibold text-brand-black">Something went wrong</h1>
      <p className="max-w-sm text-sm text-black/60">
        This page hit an unexpected error. Try again, or refresh the page.
      </p>
      <button
        onClick={reset}
        className="mt-1 rounded bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
