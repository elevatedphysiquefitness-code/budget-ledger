"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => {
        if (!d.configured) router.replace("/");
      });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Wrong PIN. Try again.");
      setPin("");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-4">
        <div className="text-center mb-2">
          <h1 className="text-xl font-semibold">Budget Ledger</h1>
          <p className="text-sm text-muted">Enter your PIN to continue</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="rounded-lg border border-border bg-surface-raised px-3 py-3 font-mono text-center text-lg tracking-widest"
          placeholder="••••"
        />
        {error && <p className="text-sm text-red text-center">{error}</p>}
        <button
          type="submit"
          disabled={submitting || pin.length < 4}
          className="rounded-lg bg-accent py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
