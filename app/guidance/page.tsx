"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import ProgressBar from "@/components/ledger/ProgressBar";
import { utilizationBucket, utilizationRatio } from "@/lib/computations/creditUtilization";
import type { DebtStrategyComparison, BudgetBenchmarksResult, BudgetBand } from "@/lib/computations/guidance";
import type { Card } from "@/types/domain";

interface EmergencyFund {
  targetAmount: number;
  currentBalance: number;
  monthsToTarget: number | null;
  targetDate: string | null;
  onTrack: boolean;
  targetMonths: number;
  monthlyEssentialExpenses: number;
}

interface GuidanceData {
  debtComparison: DebtStrategyComparison;
  emergencyFund: EmergencyFund;
  budgetBenchmarks: BudgetBenchmarksResult;
}

const bandLabel: Record<BudgetBand, string> = {
  low: "Below the common guideline",
  within: "Within the common guideline",
  high: "Above the common guideline",
};

const bandColor: Record<BudgetBand, "green" | "amber" | "red"> = {
  low: "amber",
  within: "green",
  high: "amber",
};

export default function GuidancePage() {
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [savingsBalance, setSavingsBalance] = useState("");
  const [targetMonths, setTargetMonths] = useState(3);
  const [savingsBusy, setSavingsBusy] = useState(false);

  const loadGuidance = () =>
    fetch("/api/guidance")
      .then((r) => r.json())
      .then((d: GuidanceData) => {
        setGuidance(d);
        setSavingsBalance(String(d.emergencyFund.currentBalance));
        setTargetMonths(d.emergencyFund.targetMonths);
      });

  useEffect(() => {
    loadGuidance();
    fetch("/api/cards").then((r) => r.json()).then(setCards);
  }, []);

  const saveSavingsInputs = async (balance: number, months: number) => {
    setSavingsBusy(true);
    await fetch("/api/savings-balance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance, targetMonths: months }),
    });
    await loadGuidance();
    setSavingsBusy(false);
  };

  const highUtilizationCards = (cards ?? []).filter(
    (c) => utilizationBucket(utilizationRatio(c.balance, c.creditLimit)) === "red"
  );

  return (
    <div>
      <PageHeader title="Guidance" subtitle="Based on your numbers, plus a couple of quick inputs" />

      {!guidance ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold mb-1">Debt strategy</h2>
            <p className="text-xs text-muted mb-3">
              Avalanche pays the highest-APR card first (mathematically cheapest). Snowball pays
              the smallest balance first (faster wins, usually a bit more interest).
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="text-xs text-muted mb-1">Avalanche</p>
                <p className="font-mono text-xs mb-1">{guidance.debtComparison.avalanche.debtFreeDate ?? "—"}</p>
                <LedgerAmount value={guidance.debtComparison.avalanche.totalInterestPaid} className="text-sm" />
              </div>
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="text-xs text-muted mb-1">Snowball</p>
                <p className="font-mono text-xs mb-1">{guidance.debtComparison.snowball.debtFreeDate ?? "—"}</p>
                <LedgerAmount value={guidance.debtComparison.snowball.totalInterestPaid} className="text-sm" />
              </div>
            </div>
            {guidance.debtComparison.interestSavedByAvalanche > 0 ? (
              <p className="text-sm text-green mb-2">
                Avalanche saves you{" "}
                <LedgerAmount value={guidance.debtComparison.interestSavedByAvalanche} className="text-sm text-green" />{" "}
                in interest — recommended unless you want snowball&apos;s faster early wins.
              </p>
            ) : (
              <p className="text-sm text-muted mb-2">Both strategies cost about the same here.</p>
            )}
            {highUtilizationCards.length > 0 && (
              <div className="rounded-lg border border-red/40 bg-red/10 p-3 text-sm text-red">
                {highUtilizationCards.map((c) => c.name).join(", ")} — over 90% utilized. Consider
                prioritizing regardless of strategy; high utilization can affect your credit score.
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold mb-3">Emergency fund</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="flex flex-col gap-1 text-sm">
                Current savings balance
                <input
                  type="number"
                  step="0.01"
                  value={savingsBalance}
                  onChange={(e) => setSavingsBalance(e.target.value)}
                  onBlur={() => saveSavingsInputs(Number(savingsBalance) || 0, targetMonths)}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Target
                <select
                  value={targetMonths}
                  onChange={(e) => {
                    const months = Number(e.target.value);
                    setTargetMonths(months);
                    saveSavingsInputs(Number(savingsBalance) || 0, months);
                  }}
                  className="rounded-lg border border-border bg-surface-raised px-3 py-2"
                >
                  {[3, 6, 9, 12].map((m) => (
                    <option key={m} value={m}>
                      {m} months
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs text-muted mb-2">
              Target ${guidance.emergencyFund.targetAmount.toFixed(0)} — {targetMonths} months of your{" "}
              ${guidance.emergencyFund.monthlyEssentialExpenses.toFixed(0)}/mo in bills.
            </p>
            <ProgressBar
              ratio={
                guidance.emergencyFund.targetAmount > 0
                  ? guidance.emergencyFund.currentBalance / guidance.emergencyFund.targetAmount
                  : 0
              }
              color="accent"
              className="mb-2"
            />
            <p className={clsx("text-sm", savingsBusy && "opacity-50")}>
              {guidance.emergencyFund.onTrack
                ? guidance.emergencyFund.monthsToTarget === 0
                  ? "You've already reached this goal."
                  : `About ${guidance.emergencyFund.monthsToTarget} months to reach it at your current savings rate (${guidance.emergencyFund.targetDate}).`
                : "At your current savings rate, this goal is more than 5 years away — consider increasing your monthly savings on the Where it goes page."}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold mb-1">Budget benchmarks</h2>
            <p className="text-xs text-muted mb-3">
              Common published guidelines compared to your current split of leftover income — informational,
              not personalized financial advice.
            </p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ["Savings + extra to debt", guidance.budgetBenchmarks.savingsAndDebt, "15-20%"],
                  ["Food", guidance.budgetBenchmarks.food, "10-15%"],
                ] as const
              ).map(([label, entry, range]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <LedgerAmount value={entry.amount} className="text-sm" />
                  </div>
                  <ProgressBar ratio={entry.percentOfLeftover} color={bandColor[entry.band!]} className="mb-1" />
                  <p className="text-xs text-muted">
                    {(entry.percentOfLeftover * 100).toFixed(0)}% of leftover — {bandLabel[entry.band!]} ({range}
                    ).
                  </p>
                </div>
              ))}
              {(
                [
                  ["Hobbies / Fun", guidance.budgetBenchmarks.hobbies],
                  ["Other", guidance.budgetBenchmarks.other],
                ] as const
              ).map(([label, entry]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <LedgerAmount value={entry.amount} className="text-sm" />
                  </div>
                  <ProgressBar ratio={entry.percentOfLeftover} color="accent" className="mb-1" />
                  <p className="text-xs text-muted">
                    {(entry.percentOfLeftover * 100).toFixed(0)}% of leftover — no general guideline without
                    knowing your household size or location.
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
