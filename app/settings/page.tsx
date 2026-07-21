"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PlaidLinkButton from "@/components/plaid/PlaidLinkButton";

interface PlaidStatus {
  configured: boolean;
  linked: boolean;
  institutionName: string | null;
  lastSyncedAt: string | null;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<PlaidStatus | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = () => fetch("/api/plaid/status").then((r) => r.json()).then(setStatus);

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (status?.configured && !status.linked && !linkToken) {
      fetch("/api/plaid/link-token", { method: "POST" })
        .then((r) => r.json())
        .then((d) => setLinkToken(d.linkToken ?? null));
    }
  }, [status, linkToken]);

  const handleLinkSuccess = async (publicToken: string, institutionName: string | null) => {
    setBusy(true);
    setMessage(null);
    await fetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken, institutionName }),
    });
    await fetch("/api/plaid/sync", { method: "POST" });
    await loadStatus();
    setBusy(false);
    setMessage("Bank connected and transactions synced.");
  };

  const handleSync = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/plaid/sync", { method: "POST" });
    const data = await res.json();
    await loadStatus();
    setBusy(false);
    setMessage(`Synced: ${data.added} new, ${data.modified} updated, ${data.removed} removed.`);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    setMessage(null);
    await fetch("/api/plaid/item", { method: "DELETE" });
    setLinkToken(null);
    await loadStatus();
    setBusy(false);
    setMessage("Bank disconnected. Past synced transactions are kept.");
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" />

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold mb-3">Bank connection</h2>

        {!status && <p className="text-sm text-muted">Loading…</p>}

        {status && !status.configured && (
          <p className="text-sm text-muted">
            Bank not connected — add <code className="font-mono">PLAID_CLIENT_ID</code>,{" "}
            <code className="font-mono">PLAID_SECRET</code>, and{" "}
            <code className="font-mono">PLAID_ENV</code> to <code className="font-mono">.env.local</code> to
            enable. Sign up for a free sandbox account at{" "}
            <a href="https://dashboard.plaid.com" className="underline" target="_blank" rel="noreferrer">
              dashboard.plaid.com
            </a>
            .
          </p>
        )}

        {status?.configured && !status.linked && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">Not connected yet.</p>
            {linkToken ? (
              <PlaidLinkButton linkToken={linkToken} onSuccess={handleLinkSuccess} />
            ) : (
              <p className="text-sm text-muted">Preparing secure link…</p>
            )}
          </div>
        )}

        {status?.configured && status.linked && (
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              <p>
                Connected to <strong>{status.institutionName ?? "your bank"}</strong>
              </p>
              <p className="text-muted text-xs">
                Last synced: {status.lastSyncedAt ?? "never"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={busy}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {busy ? "Working…" : "Sync now"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="flex-1 rounded-lg border border-red/40 py-2 text-sm text-red disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {message && <p className="text-xs text-muted mt-3">{message}</p>}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-muted flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Security</h2>
        <p>
          Bank access is read-only (transactions only — no auth or payment products), and this app has no
          capability to move money or make payments.
        </p>
        <p>
          Your bank credentials are never seen or stored by this app. Only Plaid&apos;s access token is
          stored, encrypted at rest with AES-256-GCM using a key in your local{" "}
          <code className="font-mono">.env.local</code> file.
        </p>
        <p>
          Anyone with filesystem access to both <code className="font-mono">.env.local</code> and the local
          database file could decrypt that token — a reasonable trust boundary for a single-user app on your
          own machine, but worth knowing. There&apos;s no key rotation: regenerating the encryption key
          means re-linking your bank.
        </p>
      </section>
    </div>
  );
}
