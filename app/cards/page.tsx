"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import CardRow from "@/components/cards/CardRow";
import CardForm, { type CardFormValues } from "@/components/cards/CardForm";
import type { Card } from "@/types/domain";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [editing, setEditing] = useState<Card | "new" | null>(null);

  const load = () => fetch("/api/cards").then((r) => r.json()).then(setCards);

  useEffect(() => {
    load();
  }, []);

  const deleteCard = async (id: number) => {
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    load();
  };

  const save = async (values: CardFormValues) => {
    if (editing && editing !== "new") {
      await fetch(`/api/cards/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } else {
      await fetch("/api/cards", {
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
        title="Cards"
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
        {cards === null && <p className="p-4 text-sm text-muted">Loading…</p>}
        {cards !== null && cards.length === 0 && (
          <p className="p-4 text-sm text-muted">No cards yet.</p>
        )}
        {cards?.map((card) => (
          <CardRow key={card.id} card={card} onEdit={() => setEditing(card)} onDelete={() => deleteCard(card.id)} />
        ))}
      </div>

      {editing !== null && (
        <Modal title={editing === "new" ? "Add card" : "Edit card"} onClose={() => setEditing(null)}>
          <CardForm
            initial={editing !== "new" ? editing : undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
