"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import BillRow from "@/components/bills/BillRow";
import BillForm, { type BillFormValues } from "@/components/bills/BillForm";
import type { Bill } from "@/types/domain";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [editing, setEditing] = useState<Bill | "new" | null>(null);

  const load = () => fetch("/api/bills").then((r) => r.json()).then(setBills);

  useEffect(() => {
    load();
  }, []);

  const togglePaid = async (id: number) => {
    await fetch(`/api/bills/${id}/toggle-paid`, { method: "POST" });
    load();
  };

  const deleteBill = async (id: number) => {
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    load();
  };

  const save = async (values: BillFormValues) => {
    if (editing && editing !== "new") {
      await fetch(`/api/bills/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } else {
      await fetch("/api/bills", {
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
        title="Bills"
        subtitle={bills ? `${bills.filter((b) => !b.paid).length} unpaid` : undefined}
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
        {bills === null && <p className="p-4 text-sm text-muted">Loading…</p>}
        {bills !== null && bills.length === 0 && (
          <p className="p-4 text-sm text-muted">No bills yet.</p>
        )}
        {bills?.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            onTogglePaid={() => togglePaid(bill.id)}
            onEdit={() => setEditing(bill)}
            onDelete={() => deleteBill(bill.id)}
          />
        ))}
      </div>

      {editing !== null && (
        <Modal title={editing === "new" ? "Add bill" : "Edit bill"} onClose={() => setEditing(null)}>
          <BillForm
            initial={editing !== "new" ? editing : undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
