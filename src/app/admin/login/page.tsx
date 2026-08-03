"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gray px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-lg font-semibold text-brand-black">H4GT Resource Library</h1>
        <p className="mb-6 text-sm text-black/60">Staff sign in</p>

        {error && (
          <p className="mb-4 rounded border border-brand-orange/30 bg-brand-orange/5 px-3 py-2 text-sm text-brand-orange">
            {error}
          </p>
        )}

        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-black/70">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-brand-orange"
          />
        </label>

        <label className="mb-6 block text-sm">
          <span className="mb-1 block text-black/70">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 outline-none focus:border-brand-orange"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-orange px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
