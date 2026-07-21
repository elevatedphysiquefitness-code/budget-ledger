"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import DebtPayoffChart from "@/components/charts/DebtPayoffChart";
import SavingsGrowthChart from "@/components/charts/SavingsGrowthChart";
import type { DebtPayoffResult } from "@/lib/computations/debtPayoff";
import type { SavingsProjectionResult } from "@/lib/computations/savingsGrowth";
import type { AllocationTargets } from "@/types/domain";

export default function ProjectionsPage() {
  const [allocation, setAllocation] = useState<AllocationTargets | null>(null);
  const [extraPayment, setExtraPayment] = useState<number | null>(null);
  const [savingsStart, setSavingsStart] = useState(0);
  const [debt, setDebt] = useState<DebtPayoffResult | null>(null);
  const [savings, setSavings] = useState<SavingsProjectionResult | null>(null);

  useEffect(() => {
    fetch("/api/allocation")
      .then((r) => r.json())
      .then((a: AllocationTargets) => {
        setAllocation(a);
        setExtraPayment(a.extraTowardDebt);
      });
  }, []);

  useEffect(() => {
    if (extraPayment === null) return;
    fetch(`/api/projections/debt?extraPayment=${extraPayment}`)
      .then((r) => r.json())
      .then(setDebt);
  }, [extraPayment]);

  useEffect(() => {
    fetch(`/api/projections/savings?startingBalance=${savingsStart}`)
      .then((r) => r.json())
      .then(setSavings);
  }, [savingsStart]);

  return (
    <div>
      <PageHeader title="Projections" subtitle="Debt payoff & savings growth" />

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-semibold mb-3">Debt payoff (avalanche)</h2>

          {allocation && extraPayment !== null && (
            <label className="flex flex-col gap-1 text-sm mb-4">
              <span className="flex justify-between">
                <span className="text-muted">Extra payment / month</span>
                <LedgerAmount value={extraPayment} />
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(allocation.extraTowardDebt * 3, 500)}
                step={10}
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
              />
            </label>
          )}

          {debt && debt.months.length > 0 ? (
            <>
              <DebtPayoffChart months={debt.months} />
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-muted text-xs">Debt-free date</p>
                  <p className="font-mono">{debt.debtFreeDate ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Total interest paid</p>
                  <LedgerAmount value={debt.totalInterestPaid} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No card balances to project.</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-semibold mb-3">Savings growth</h2>

          <label className="flex flex-col gap-1 text-sm mb-4">
            Starting savings balance
            <input
              type="number"
              step="0.01"
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
              value={savingsStart}
              onChange={(e) => setSavingsStart(Number(e.target.value) || 0)}
            />
          </label>

          {allocation && (
            <p className="text-xs text-muted mb-3">
              Assumes ${allocation.savings}/mo contribution at {allocation.savingsApy}% APY — adjust these on
              the Where it goes page.
            </p>
          )}

          {savings && (
            <>
              <SavingsGrowthChart points={savings.points} />
              <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                <div>
                  <p className="text-muted">6mo</p>
                  <LedgerAmount value={savings.milestones.sixMonth} className="text-xs" />
                </div>
                <div>
                  <p className="text-muted">1yr</p>
                  <LedgerAmount value={savings.milestones.oneYear} className="text-xs" />
                </div>
                <div>
                  <p className="text-muted">3yr</p>
                  <LedgerAmount value={savings.milestones.threeYear} className="text-xs" />
                </div>
                <div>
                  <p className="text-muted">5yr</p>
                  <LedgerAmount value={savings.milestones.fiveYear} className="text-xs" />
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
