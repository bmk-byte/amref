"use client";

import Image from "next/image";
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Image
        src="/heroes-logo.png"
        alt=""
        aria-hidden="true"
        width={660}
        height={640}
        className="h-12 w-auto opacity-60"
      />
      <h1 className="font-display text-xl font-semibold text-brand-black">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-brand-muted">
        The resource library hit an unexpected error. Please try again — if it keeps
        happening, contact the Amref Uganda Communications Unit.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-full bg-brand-orange px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
