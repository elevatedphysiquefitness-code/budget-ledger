"use client";

import { useState } from "react";

export interface CardFormValues {
  name: string;
  balance: number;
  creditLimit: number;
  apr: number;
}

export default function CardForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: CardFormValues;
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? "");
  const [creditLimit, setCreditLimit] = useState(initial?.creditLimit?.toString() ?? "");
  const [apr, setApr] = useState(initial?.apr?.toString() ?? "");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          balance: Number(balance) || 0,
          creditLimit: Number(creditLimit) || 0,
          apr: Number(apr) || 0,
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
        Balance
        <input
          type="number"
          step="0.01"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Credit limit
        <input
          type="number"
          step="0.01"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        APR (%)
        <input
          type="number"
          step="0.01"
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 font-mono"
          value={apr}
          onChange={(e) => setApr(e.target.value)}
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
