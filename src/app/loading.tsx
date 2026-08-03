import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Image
        src="/heroes-logo.png"
        alt=""
        aria-hidden="true"
        width={660}
        height={640}
        className="h-12 w-auto animate-pulse"
      />
      <p className="text-sm text-brand-muted">Loading the resource library…</p>
    </div>
  );
}
