import { getDb } from "@/db/client";
import type { Card } from "@/types/domain";

interface CardRow {
  id: number;
  name: string;
  balance: number;
  credit_limit: number;
  apr: number;
}

function rowToCard(row: CardRow): Card {
  return { id: row.id, name: row.name, balance: row.balance, creditLimit: row.credit_limit, apr: row.apr };
}

export function listCards(): Card[] {
  const rows = getDb().prepare("SELECT * FROM cards ORDER BY apr DESC, name").all() as CardRow[];
  return rows.map(rowToCard);
}

export function getCard(id: number): Card | undefined {
  const row = getDb().prepare("SELECT * FROM cards WHERE id = ?").get(id) as CardRow | undefined;
  return row ? rowToCard(row) : undefined;
}

export function createCard(input: {
  name: string;
  balance: number;
  creditLimit: number;
  apr: number;
}): Card {
  const result = getDb()
    .prepare(
      "INSERT INTO cards (name, balance, credit_limit, apr) VALUES (@name, @balance, @creditLimit, @apr)"
    )
    .run(input);
  return getCard(result.lastInsertRowid as number)!;
}

export function updateCard(
  id: number,
  input: Partial<{ name: string; balance: number; creditLimit: number; apr: number }>
): Card | undefined {
  const existing = getCard(id);
  if (!existing) return undefined;
  const merged = {
    id,
    name: input.name ?? existing.name,
    balance: input.balance ?? existing.balance,
    creditLimit: input.creditLimit ?? existing.creditLimit,
    apr: input.apr ?? existing.apr,
  };
  getDb().prepare(
    "UPDATE cards SET name = @name, balance = @balance, credit_limit = @creditLimit, apr = @apr, updated_at = datetime('now') WHERE id = @id"
  ).run(merged);
  return getCard(id);
}

export function deleteCard(id: number): void {
  getDb().prepare("DELETE FROM cards WHERE id = ?").run(id);
}
