import { db } from "@/db/client";
import type { Bill } from "@/types/domain";
import { currentCycleKey, reconcileBillCycles } from "@/lib/computations/billingCycle";

interface BillRow {
  id: number;
  name: string;
  amount: number;
  due_day: number | null;
  paid: number;
  paid_cycle_key: string | null;
}

function rowToBill(row: BillRow): Bill {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    dueDay: row.due_day,
    paid: !!row.paid,
    paidCycleKey: row.paid_cycle_key,
  };
}

/** Lists bills, auto-resetting any whose paid cycle has rolled over, persisting the diff. */
export function listBills(): Bill[] {
  const rows = db
    .prepare("SELECT * FROM bills ORDER BY due_day IS NULL, due_day, name")
    .all() as BillRow[];
  const bills = rows.map(rowToBill);

  const changed = reconcileBillCycles(bills, new Date());
  if (changed.length === 0) return bills;

  const update = db.prepare(
    "UPDATE bills SET paid = @paid, paid_cycle_key = @paidCycleKey, updated_at = datetime('now') WHERE id = @id"
  );
  const run = db.transaction((items: Bill[]) => {
    for (const b of items) {
      update.run({ paid: b.paid ? 1 : 0, paidCycleKey: b.paidCycleKey, id: b.id });
    }
  });
  run(changed);

  const changedById = new Map(changed.map((b) => [b.id, b]));
  return bills.map((b) => changedById.get(b.id) ?? b);
}

export function getBill(id: number): Bill | undefined {
  const row = db.prepare("SELECT * FROM bills WHERE id = ?").get(id) as BillRow | undefined;
  return row ? rowToBill(row) : undefined;
}

export function createBill(input: { name: string; amount: number; dueDay: number | null }): Bill {
  const result = db
    .prepare(
      "INSERT INTO bills (name, amount, due_day, paid, paid_cycle_key) VALUES (@name, @amount, @dueDay, 0, NULL)"
    )
    .run(input);
  return getBill(result.lastInsertRowid as number)!;
}

export function updateBill(
  id: number,
  input: Partial<{ name: string; amount: number; dueDay: number | null }>
): Bill | undefined {
  const existing = getBill(id);
  if (!existing) return undefined;
  const merged = {
    id,
    name: input.name ?? existing.name,
    amount: input.amount ?? existing.amount,
    dueDay: input.dueDay !== undefined ? input.dueDay : existing.dueDay,
  };
  db.prepare(
    "UPDATE bills SET name = @name, amount = @amount, due_day = @dueDay, updated_at = datetime('now') WHERE id = @id"
  ).run(merged);
  return getBill(id);
}

export function deleteBill(id: number): void {
  db.prepare("DELETE FROM bills WHERE id = ?").run(id);
}

export function toggleBillPaid(id: number): Bill | undefined {
  const existing = getBill(id);
  if (!existing) return undefined;

  if (existing.paid) {
    db.prepare(
      "UPDATE bills SET paid = 0, paid_cycle_key = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(id);
  } else {
    const cycleKey = existing.dueDay !== null ? currentCycleKey(existing.dueDay, new Date()) : null;
    db.prepare(
      "UPDATE bills SET paid = 1, paid_cycle_key = @cycleKey, updated_at = datetime('now') WHERE id = @id"
    ).run({ cycleKey, id });
  }
  return getBill(id);
}
