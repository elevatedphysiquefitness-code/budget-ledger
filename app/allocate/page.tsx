"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import AllocationBar from "@/components/allocate/AllocationBar";
import { computeAllocation } from "@/lib/computations/allocator";
import type { AllocationTargets, Bill, PaySchedule } from "@/types/domain";

export default function AllocatePage() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [income, setIncome] = useState<PaySchedule | null>(null);
  const [targets, setTargets] = useState<AllocationTargets | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/bills").then((r) => r.json()).then(setBills);
    fetch("/api/income").then((r) => r.json()).then(setIncome);
    fetch("/api/allocation").then((r) => r.json()).then(setTargets);
  }, []);

  const result = useMemo(() => {
    if (!bills || !income || !targets) return null;
    const monthlyIncome = income.monthlyAverageNet ?? income.netPerPaycheck;
    return computeAllocation(
      monthlyIncome,
      bills.filter((b) => !b.paid),
      targets
    );
  }, [bills, income, targets]);

  const updateTarget = (key: keyof AllocationTargets, value: string) => {
    if (!targets) return;
    setTargets({ ...targets, [key]: Number(value) || 0 });
  };

  const save = async () => {
    if (!targets) return;
    setSaving(true);
    const res = await fetch("/api/allocation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targets),
    });
    setTargets(await res.json());
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="Where it goes" subtitle="Split your leftover income" />

      {!result || !targets ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">Monthly income</span>
              <LedgerAmount value={result.income} />
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted">Unpaid bills</span>
              <LedgerAmount value={result.unpaidBillsTotal} />
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-border pt-2 mt-1">
              <span>Leftover</span>
              <LedgerAmount value={result.leftover} />
            </div>
          </div>

          {result.overAllocated && (
            <div className="rounded-xl border border-red/40 bg-red/10 p-4 text-sm text-red">
              Over-allocated by <LedgerAmount value={Math.abs(result.remainderAfterTargets)} className="text-red" /> —
              your targets add up to more than you have leftover.
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-4">
            <AllocationBar targets={targets} total={result.targetsTotal} />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
            {(
              [
                ["savings", "Savings"],
                ["food", "Food / Meal Prep"],
                ["hobbies", "Hobbies / Fun"],
                ["other", "Other"],
                ["extraTowardDebt", "Extra toward debt"],
              ] as [keyof AllocationTargets, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span>{label}</span>
                <input
                  type="number"
                  step="1"
                  className="w-28 rounded-lg border border-border bg-surface-raised px-3 py-1.5 font-mono text-right"
                  value={targets[key]}
                  onChange={(e) => updateTarget(key, e.target.value)}
                />
              </label>
            ))}
            <label className="flex items-center justify-between gap-3 text-sm border-t border-border pt-3">
              <span>Savings APY (%)</span>
              <input
                type="number"
                step="0.01"
                className="w-28 rounded-lg border border-border bg-surface-raised px-3 py-1.5 font-mono text-right"
                value={targets.savingsApy}
                onChange={(e) => updateTarget("savingsApy", e.target.value)}
              />
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="mt-1 rounded-lg bg-accent py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save targets"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
