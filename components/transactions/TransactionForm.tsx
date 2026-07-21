"use client";

import { useState } from "react";

export interface TransactionFormValues {
  date: string;
  description: string;
  amount: number;
}

export default function TransactionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: TransactionFormValues;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ date, description, amount: Number(amount) || 0 });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        Date
        <input
          type="date"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description
        <input
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-sans"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Amount (positive = inflow, negative = outflow)
        <input
          type="number"
          step="0.01"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
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
