"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import BalanceSparkline from "@/components/charts/BalanceSparkline";
import { utilizationBucket, utilizationRatio } from "@/lib/computations/creditUtilization";
import type { Bill, Card, PaySchedule } from "@/types/domain";
import type { CashFlowForecastResult } from "@/lib/computations/cashFlowForecast";

interface BalanceInfo {
  balance: number;
  connected: boolean;
}

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
}

export default function DashboardPage() {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [income, setIncome] = useState<PaySchedule | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecastResult | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);

  const loadBalance = () => fetch("/api/balance").then((r) => r.json()).then(setBalance);
  const loadForecast = () =>
    fetch("/api/forecast?horizonDays=30").then((r) => r.json()).then(setForecast);

  useEffect(() => {
    loadBalance();
    fetch("/api/bills").then((r) => r.json()).then(setBills);
    fetch("/api/cards").then((r) => r.json()).then(setCards);
    fetch("/api/income").then((r) => r.json()).then(setIncome);
    loadForecast();
    fetch("/api/update-check").then((r) => r.json()).then(setUpdateInfo);
  }, []);

  const startEditingBalance = () => {
    setBalanceInput(balance ? String(balance.balance) : "0");
    setEditingBalance(true);
  };

  const saveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBalance(true);
    await fetch("/api/balance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: Number(balanceInput) || 0 }),
    });
    setSavingBalance(false);
    setEditingBalance(false);
    await Promise.all([loadBalance(), loadForecast()]);
  };

  const upcomingBills = (bills ?? [])
    .filter((b) => !b.paid)
    .sort((a, b) => (a.dueDay ?? 99) - (b.dueDay ?? 99))
    .slice(0, 3);

  const nextPayDate = income ? nextUpcomingPayDate(income.nextPayDate, income.payIntervalDays) : null;
  const daysUntilPayday = nextPayDate
    ? Math.round((nextPayDate.getTime() - startOfToday().getTime()) / 86_400_000)
    : null;

  const totalBalance = (cards ?? []).reduce((s, c) => s + c.balance, 0);
  const totalLimit = (cards ?? []).reduce((s, c) => s + c.creditLimit, 0);
  const overallRatio = utilizationRatio(totalBalance, totalLimit);
  const overallBucket = utilizationBucket(overallRatio);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Budget Ledger" subtitle="Today" />

      {updateInfo?.updateAvailable && !updateDismissed && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 flex items-center justify-between gap-3">
          <p className="text-sm">
            Version {updateInfo.latestVersion} is available (you have {updateInfo.currentVersion}).{" "}
            <a href={updateInfo.releaseUrl ?? undefined} target="_blank" rel="noreferrer" className="underline font-medium">
              Download it
            </a>
            .
          </p>
          <button
            onClick={() => setUpdateDismissed(true)}
            aria-label="Dismiss"
            className="text-muted hover:text-foreground text-sm shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted">Current balance</p>
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-muted">
            {balance?.connected ? "Live" : "Manual · not connected"}
          </span>
        </div>

        {editingBalance && !balance?.connected ? (
          <form onSubmit={saveBalance} className="flex items-center gap-2 mt-1">
            <input
              type="number"
              step="0.01"
              autoFocus
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono text-xl"
            />
            <button
              type="submit"
              disabled={savingBalance}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingBalance(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted"
            >
              Cancel
            </button>
          </form>
        ) : balance?.connected ? (
          <LedgerAmount value={balance?.balance ?? 0} className="text-3xl" />
        ) : (
          <button onClick={startEditingBalance} className="flex items-center gap-2 mt-1">
            <LedgerAmount value={balance?.balance ?? 0} className="text-3xl" />
            <span className="text-muted text-xs">Edit</span>
          </button>
        )}
        {balance?.connected && (
          <p className="text-xs text-muted mt-1">Synced from your bank — editing is disabled while connected.</p>
        )}
      </div>

      <Link href="/forecast" className="rounded-xl border border-border bg-surface p-4 block">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">30-day forecast</p>
          <span className="text-muted text-xs">&rsaquo;</span>
        </div>
        {forecast && <BalanceSparkline days={forecast.days} />}
        {forecast?.firstNegativeDate && (
          <p className="text-xs text-red mt-1">Goes negative {forecast.firstNegativeDate}</p>
        )}
        {!forecast?.firstNegativeDate && forecast?.firstLowBalanceDate && (
          <p className="text-xs text-amber mt-1">Drops under $100 on {forecast.firstLowBalanceDate}</p>
        )}
        {forecast && !forecast.firstNegativeDate && !forecast.firstLowBalanceDate && (
          <p className="text-xs text-green mt-1">Stays healthy</p>
        )}
      </Link>

      <Link href="/bills" className="rounded-xl border border-border bg-surface p-4 block">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Upcoming bills</p>
          <span className="text-muted text-xs">&rsaquo;</span>
        </div>
        {upcomingBills.length === 0 && <p className="text-sm text-muted">All caught up.</p>}
        <div className="flex flex-col gap-1.5">
          {upcomingBills.map((b) => (
            <div key={b.id} className="flex justify-between text-sm">
              <span>
                {b.name}
                <span className="text-muted">{b.dueDay !== null ? ` · due ${b.dueDay}` : ""}</span>
              </span>
              <LedgerAmount value={b.amount} className="text-sm" />
            </div>
          ))}
        </div>
      </Link>

      <Link href="/income" className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Next payday</p>
          <p className="text-xs text-muted">
            {nextPayDate && isoDate(nextPayDate)} {daysUntilPayday !== null && `· in ${daysUntilPayday}d`}
          </p>
        </div>
        {income && <LedgerAmount value={income.netPerPaycheck} />}
      </Link>

      <Link href="/cards" className="rounded-xl border border-border bg-surface p-4 block">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Card utilization</p>
          <span
            className={clsx(
              "text-xs font-medium",
              overallBucket === "red" ? "text-red" : overallBucket === "amber" ? "text-amber" : "text-green"
            )}
          >
            {(overallRatio * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {(cards ?? []).map((c) => {
            const bucket = utilizationBucket(utilizationRatio(c.balance, c.creditLimit));
            return (
              <span
                key={c.id}
                className={clsx(
                  "h-1.5 flex-1 rounded-full",
                  bucket === "red" ? "bg-red" : bucket === "amber" ? "bg-amber" : "bg-green"
                )}
              />
            );
          })}
        </div>
      </Link>
    </div>
  );
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Steps a possibly-stale stored pay date forward by the pay interval until
 *  it lands on today or later, mirroring the forecast module's own logic. */
function nextUpcomingPayDate(nextPayDate: string, intervalDays: number): Date {
  const today = startOfToday();
  let current = parseIsoDate(nextPayDate);
  while (current < today) {
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + intervalDays);
  }
  return current;
}
