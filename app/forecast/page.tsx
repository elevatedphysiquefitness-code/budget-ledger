"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import CashFlowChart from "@/components/charts/CashFlowChart";
import type { CashFlowForecastResult } from "@/lib/computations/cashFlowForecast";

const horizons = [30, 60, 90] as const;

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<(typeof horizons)[number]>(30);
  const [forecast, setForecast] = useState<CashFlowForecastResult | null>(null);

  useEffect(() => {
    fetch(`/api/forecast?horizonDays=${horizon}`)
      .then((r) => r.json())
      .then(setForecast);
  }, [horizon]);

  const eventDays = forecast?.days.filter((d) => d.events.length > 0) ?? [];

  return (
    <div>
      <PageHeader title="Cash-flow forecast" subtitle="Projected checking balance" />

      <div className="flex gap-2 mb-4">
        {horizons.map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={clsx(
              "flex-1 rounded-lg py-2 text-sm font-medium border",
              horizon === h ? "bg-accent text-background border-accent" : "border-border text-muted"
            )}
          >
            {h} days
          </button>
        ))}
      </div>

      {!forecast ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {forecast.firstNegativeDate && (
            <div className="rounded-xl border border-red/40 bg-red/10 p-4 text-sm text-red">
              Balance is projected to go <strong>negative</strong> on {forecast.firstNegativeDate}.
            </div>
          )}
          {!forecast.firstNegativeDate && forecast.firstLowBalanceDate && (
            <div className="rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-amber">
              Balance is projected to drop under $100 on {forecast.firstLowBalanceDate}.
            </div>
          )}
          {!forecast.firstNegativeDate && !forecast.firstLowBalanceDate && (
            <div className="rounded-xl border border-green/40 bg-green/10 p-4 text-sm text-green">
              Balance stays healthy for the next {horizon} days.
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-4">
            <CashFlowChart days={forecast.days} />
            <div className="flex justify-between text-sm mt-3">
              <span className="text-muted">Lowest projected balance</span>
              <span>
                <LedgerAmount value={forecast.worstBalance} /> on {forecast.worstBalanceDate}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
            <p className="px-4 py-2 text-xs uppercase tracking-wide text-muted">Upcoming activity</p>
            {eventDays.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted">No bills or paydays in this window.</p>
            )}
            {eventDays.map((day) => (
              <div key={day.date} className="px-4 py-3">
                <p className="text-xs text-muted mb-1">{day.date}</p>
                {day.events.map((event, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{event.label}</span>
                    <LedgerAmount value={event.amount} variant="signed" className="text-sm" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
