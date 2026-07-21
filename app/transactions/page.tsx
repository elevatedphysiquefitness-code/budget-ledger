"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import TransactionRow from "@/components/transactions/TransactionRow";
import TransactionForm, { type TransactionFormValues } from "@/components/transactions/TransactionForm";
import type { TransactionWithBalance } from "@/lib/repositories/transactionsRepo";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithBalance[] | null>(null);
  const [editing, setEditing] = useState<TransactionWithBalance | "new" | null>(null);

  const load = () => fetch("/api/transactions").then((r) => r.json()).then(setTransactions);

  useEffect(() => {
    load();
  }, []);

  const deleteTransaction = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const save = async (values: TransactionFormValues) => {
    if (editing && editing !== "new") {
      await fetch(`/api/transactions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } else {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        action={
          <button
            onClick={() => setEditing("new")}
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-background"
          >
            + Add
          </button>
        }
      />

      <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
        {transactions === null && <p className="p-4 text-sm text-muted">Loading…</p>}
        {transactions !== null && transactions.length === 0 && (
          <p className="p-4 text-sm text-muted">No transactions yet.</p>
        )}
        {transactions?.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            onEdit={() => setEditing(t)}
            onDelete={() => deleteTransaction(t.id)}
          />
        ))}
      </div>

      {editing !== null && (
        <Modal
          title={editing === "new" ? "Add transaction" : "Edit transaction"}
          onClose={() => setEditing(null)}
        >
          <TransactionForm
            initial={editing !== "new" ? editing : undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
