"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import type { FederalWithholding, PayFrequency, PaySchedule } from "@/types/domain";

export default function IncomePage() {
  const [schedule, setSchedule] = useState<PaySchedule | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/income").then((r) => r.json()).then(setSchedule);
  }, []);

  const update = <K extends keyof PaySchedule>(key: K, value: PaySchedule[K]) => {
    if (!schedule) return;
    setSchedule({ ...schedule, [key]: value });
  };

  const save = async () => {
    if (!schedule) return;
    setSaving(true);
    const res = await fetch("/api/income", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schedule),
    });
    setSchedule(await res.json());
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="Pay schedule" />
      {!schedule ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Next pay date
            <input
              type="date"
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
              value={schedule.nextPayDate}
              onChange={(e) => update("nextPayDate", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Net amount per paycheck
            <input
              type="number"
              step="0.01"
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
              value={schedule.netPerPaycheck}
              onChange={(e) => update("netPerPaycheck", Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Pay frequency
            <select
              className="rounded-lg border border-border bg-surface-raised px-3 py-2"
              value={schedule.payFrequency}
              onChange={(e) => update("payFrequency", e.target.value as PayFrequency)}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="semimonthly">Semimonthly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Days between paychecks
            <input
              type="number"
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
              value={schedule.payIntervalDays}
              onChange={(e) => update("payIntervalDays", Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hourly rate (optional)
            <input
              type="number"
              step="0.01"
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
              value={schedule.hourlyRate ?? ""}
              onChange={(e) => update("hourlyRate", e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Monthly average net (used for budget planning)
            <input
              type="number"
              step="0.01"
              className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
              value={schedule.monthlyAverageNet ?? ""}
              onChange={(e) =>
                update("monthlyAverageNet", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Federal withholding
            <select
              className="rounded-lg border border-border bg-surface-raised px-3 py-2"
              value={schedule.federalWithholding}
              onChange={(e) => update("federalWithholding", e.target.value as FederalWithholding)}
            >
              <option value="exempt">Exempt</option>
              <option value="standard">Standard</option>
            </select>
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="mt-1 rounded-lg bg-accent py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save pay schedule"}
          </button>
        </div>
      )}
    </div>
  );
}
