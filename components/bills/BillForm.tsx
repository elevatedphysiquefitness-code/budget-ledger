"use client";

import { useState } from "react";

export interface BillFormValues {
  name: string;
  amount: number;
  dueDay: number | null;
}

export default function BillForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: BillFormValues;
  onSubmit: (values: BillFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [dueDay, setDueDay] = useState(initial?.dueDay?.toString() ?? "");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          amount: Number(amount) || 0,
          dueDay: dueDay === "" ? null : Number(dueDay),
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-sans"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Amount
        <input
          type="number"
          step="0.01"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Due day of month (optional)
        <input
          type="number"
          min={1}
          max={31}
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          placeholder="Not scheduled yet"
        />
      </label>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2 text-sm text-muted"
        >
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-lg bg-accent py-2 text-sm text-background font-medium">
          Save
        </button>
      </div>
    </form>
  );
}
