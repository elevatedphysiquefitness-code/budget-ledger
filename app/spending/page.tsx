"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import CategoryRow from "@/components/spending/CategoryRow";
import type { SpendingByCategoryResult } from "@/lib/computations/spendingByCategory";

const periods = [
  { value: "month", label: "This month" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

export default function SpendingPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]["value"]>("month");
  const [result, setResult] = useState<SpendingByCategoryResult | null>(null);

  useEffect(() => {
    fetch(`/api/spending?period=${period}`)
      .then((r) => r.json())
      .then(setResult);
  }, [period]);

  return (
    <div>
      <PageHeader title="Spending" subtitle="Where your money goes, by category" />

      <div className="flex gap-2 mb-4">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={clsx(
              "flex-1 rounded-lg py-2 text-sm font-medium border",
              period === p.value ? "bg-accent text-background border-accent" : "border-border text-muted"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!result ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted mb-1">Total spent</p>
            <LedgerAmount value={result.totalSpent} className="text-2xl" />
          </div>

          <div className="rounded-xl border border-border bg-surface divide-y divide-border px-4">
            {result.categories.length === 0 ? (
              <p className="py-4 text-sm text-muted">No spending in this window.</p>
            ) : (
              result.categories.map((category) => (
                <CategoryRow key={category.category} category={category} totalSpent={result.totalSpent} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
