"use client";

export type ToastMessage = { id: string; type: "success" | "error"; text: string };

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-3 rounded-lg border px-4 py-2 text-sm shadow-lg ${
            t.type === "success"
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-brand-red/30 bg-brand-red/5 text-brand-red"
          }`}
        >
          <span>{t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
