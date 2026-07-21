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
  const [linkTokenError, setLinkTokenError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [lanUrl, setLanUrl] = useState<string | null>(null);
  const [alternateUrls, setAlternateUrls] = useState<string[]>([]);

  const [plaidClientId, setPlaidClientId] = useState("");
  const [plaidSecret, setPlaidSecret] = useState("");
  const [plaidEnv, setPlaidEnv] = useState("sandbox");
  const [credsBusy, setCredsBusy] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [showCredsForm, setShowCredsForm] = useState(false);

  const [pinConfigured, setPinConfigured] = useState<boolean | null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const loadStatus = () => fetch("/api/plaid/status").then((r) => r.json()).then(setStatus);
  const loadPinStatus = () =>
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setPinConfigured(d.configured));

  useEffect(() => {
    loadStatus();
    loadPinStatus();
    fetch("/api/network-info")
      .then((r) => r.json())
      .then((d) => {
        setLanUrl(d.lanUrl);
        setAlternateUrls(d.alternateUrls ?? []);
      });
  }, []);

  useEffect(() => {
    if (status?.configured && !status.linked && !linkToken && !linkTokenError) {
      fetch("/api/plaid/link-token", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d.linkToken) {
            setLinkToken(d.linkToken);
          } else {
            setLinkTokenError(d.message ?? "Could not prepare the bank connection.");
          }
        })
        .catch(() => setLinkTokenError("Could not prepare the bank connection."));
    }
  }, [status, linkToken, linkTokenError]);

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
    setLinkTokenError(null);
    await loadStatus();
    setBusy(false);
    setMessage("Bank disconnected. Past synced transactions are kept.");
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredsError(null);
    if (!plaidClientId.trim() || !plaidSecret.trim()) {
      setCredsError("Enter both your Client ID and Secret.");
      return;
    }
    setCredsBusy(true);
    const res = await fetch("/api/plaid/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: plaidClientId, secret: plaidSecret, env: plaidEnv }),
    });
    setCredsBusy(false);
    if (!res.ok) {
      setCredsError("Could not save those keys.");
      return;
    }
    setPlaidClientId("");
    setPlaidSecret("");
    setShowCredsForm(false);
    setLinkToken(null); // force a fresh link token using the new credentials
    setLinkTokenError(null);
    await loadStatus();
  };

  const changeCredentials = async () => {
    setCredsBusy(true);
    await fetch("/api/plaid/credentials", { method: "DELETE" });
    setCredsBusy(false);
    setLinkToken(null);
    setLinkTokenError(null);
    setShowCredsForm(true);
    await loadStatus();
  };

  const clearPinForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinMessage(null);
    if (newPin !== confirmPin) {
      setPinError("PINs don't match.");
      return;
    }
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 characters.");
      return;
    }
    setPinBusy(true);
    const res = await fetch("/api/auth/set-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin: pinConfigured ? currentPin : undefined, newPin }),
    });
    setPinBusy(false);
    if (!res.ok) {
      setPinError("Current PIN is incorrect.");
      return;
    }
    clearPinForm();
    setPinMessage(pinConfigured ? "PIN updated." : "PIN set — your phone will need it to open the app.");
    loadPinStatus();
  };

  const removePin = async () => {
    setPinError(null);
    setPinMessage(null);
    if (!currentPin) {
      setPinError("Enter your current PIN to remove it.");
      return;
    }
    setPinBusy(true);
    const res = await fetch("/api/auth/remove-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin }),
    });
    setPinBusy(false);
    if (!res.ok) {
      setPinError("Current PIN is incorrect.");
      return;
    }
    clearPinForm();
    setPinMessage("PIN removed — the app no longer requires one.");
    loadPinStatus();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" />

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold mb-3">Access from your phone</h2>
        {lanUrl ? (
          <>
            <p className="text-sm text-muted mb-2">
              With your phone on the same WiFi as this computer, open:
            </p>
            <p className="rounded-lg bg-surface-raised px-3 py-2 font-mono text-sm break-all">{lanUrl}</p>
            {alternateUrls.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted mb-1">
                  If that doesn&apos;t load, this computer has more than one network connection — try:
                </p>
                <div className="flex flex-col gap-1.5">
                  {alternateUrls.map((url) => (
                    <p
                      key={url}
                      className="rounded-lg bg-surface-raised px-3 py-2 font-mono text-sm break-all"
                    >
                      {url}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">No network connection detected.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold mb-3">App Lock</h2>
        {pinConfigured === null && <p className="text-sm text-muted">Loading…</p>}
        {pinConfigured !== null && (
          <>
            <p className="text-sm text-muted mb-3">
              {pinConfigured
                ? "A PIN is required before anyone can open this app, including from your phone."
                : "Set a PIN so anyone opening this app from your phone (or anyone else on your WiFi) needs it first."}
            </p>
            <form onSubmit={submitPin} className="flex flex-col gap-3">
              {pinConfigured && (
                <label className="flex flex-col gap-1 text-sm">
                  Current PIN
                  <input
                    type="password"
                    inputMode="numeric"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
                  />
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm">
                {pinConfigured ? "New PIN" : "PIN"}
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Confirm {pinConfigured ? "new " : ""}PIN
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
                />
              </label>
              {pinError && <p className="text-sm text-red">{pinError}</p>}
              {pinMessage && <p className="text-sm text-green">{pinMessage}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pinBusy}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-background disabled:opacity-50"
                >
                  {pinBusy ? "Working…" : pinConfigured ? "Update PIN" : "Set PIN"}
                </button>
                {pinConfigured && (
                  <button
                    type="button"
                    onClick={removePin}
                    disabled={pinBusy}
                    className="flex-1 rounded-lg border border-red/40 py-2 text-sm text-red disabled:opacity-50"
                  >
                    Remove PIN
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold mb-3">Bank connection</h2>

        {!status && <p className="text-sm text-muted">Loading…</p>}

        {status && (!status.configured || showCredsForm) && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Sign up for a free sandbox account at{" "}
              <a href="https://dashboard.plaid.com" className="underline" target="_blank" rel="noreferrer">
                dashboard.plaid.com
              </a>
              , then enter your keys below.
            </p>
            <form onSubmit={submitCredentials} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Client ID
                <input
                  value={plaidClientId}
                  onChange={(e) => setPlaidClientId(e.target.value)}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Secret
                <input
                  type="password"
                  value={plaidSecret}
                  onChange={(e) => setPlaidSecret(e.target.value)}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Environment
                <select
                  value={plaidEnv}
                  onChange={(e) => setPlaidEnv(e.target.value)}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2"
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </select>
              </label>
              {credsError && <p className="text-sm text-red">{credsError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={credsBusy}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-background disabled:opacity-50"
                >
                  {credsBusy ? "Saving…" : "Save keys"}
                </button>
                {showCredsForm && (
                  <button
                    type="button"
                    onClick={() => setShowCredsForm(false)}
                    className="flex-1 rounded-lg border border-border py-2 text-sm text-muted"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {status?.configured && !showCredsForm && !status.linked && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">Not connected yet.</p>
            {linkTokenError ? (
              <p className="text-sm text-red">{linkTokenError}</p>
            ) : linkToken ? (
              <PlaidLinkButton linkToken={linkToken} onSuccess={handleLinkSuccess} />
            ) : (
              <p className="text-sm text-muted">Preparing secure link…</p>
            )}
            <button onClick={changeCredentials} disabled={credsBusy} className="text-xs text-muted underline text-left">
              Change Plaid keys
            </button>
          </div>
        )}

        {status?.configured && !showCredsForm && status.linked && (
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
            <button onClick={changeCredentials} disabled={credsBusy} className="text-xs text-muted underline text-left">
              Change Plaid keys
            </button>
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
          Your bank credentials are never seen or stored by this app. Only Plaid&apos;s access token (and
          your Plaid API secret, if entered above) is stored, encrypted at rest with AES-256-GCM using a
          key generated automatically on this computer the first time it&apos;s needed.
        </p>
        <p>
          Anyone with access to this app&apos;s local data folder could decrypt those — a reasonable trust
          boundary for a single-user app on your own machine, but worth knowing. There&apos;s no key
          rotation: resetting the encryption key means re-entering your Plaid keys and re-linking your bank.
        </p>
        <p>
          Phone access uses plain HTTP over your local WiFi, not HTTPS — fine for a trusted home network, but
          anything already on that network could technically eavesdrop on the traffic. The App Lock PIN
          prevents casual access, not a determined attacker already on your WiFi.
        </p>
      </section>
    </div>
  );
}
