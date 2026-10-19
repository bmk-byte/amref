"use client";

import { useEffect, useState } from "react";

// useDeferredValue only deprioritizes rendering — it doesn't reduce how many
// times a value changes, which is what matters once every committed search
// term triggers a real server round-trip instead of an in-memory filter.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
