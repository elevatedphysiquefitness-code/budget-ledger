import { getDb } from "@/db/client";
import type { Transaction } from "@/types/domain";
import { getSettingNumber } from "@/lib/repositories/settingsRepo";

interface TransactionRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  source: string;
  plaid_transaction_id: string | null;
  plaid_account_id: string | null;
  category: string | null;
  pending: number;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: row.amount,
    source: row.source as Transaction["source"],
    plaidTransactionId: row.plaid_transaction_id,
    plaidAccountId: row.plaid_account_id,
    category: row.category,
    pending: !!row.pending,
  };
}

export interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

/** Most-recent-first, each annotated with its running balance computed forward
 *  from the starting_balance setting through chronological order. */
export function listTransactionsWithRunningBalance(): TransactionWithBalance[] {
  const rows = getDb()
    .prepare("SELECT * FROM transactions ORDER BY date ASC, id ASC")
    .all() as TransactionRow[];
  const transactions = rows.map(rowToTransaction);

  let balance = getSettingNumber("starting_balance", 0);
  const withBalance: TransactionWithBalance[] = transactions.map((t) => {
    balance += t.amount;
    return { ...t, runningBalance: Math.round(balance * 100) / 100 };
  });

  return withBalance.reverse();
}

export function getTransaction(id: number): Transaction | undefined {
  const row = getDb().prepare("SELECT * FROM transactions WHERE id = ?").get(id) as
    | TransactionRow
    | undefined;
  return row ? rowToTransaction(row) : undefined;
}

export function createManualTransaction(input: {
  date: string;
  description: string;
  amount: number;
}): Transaction {
  const result = getDb()
    .prepare(
      `INSERT INTO transactions (date, description, amount, source, plaid_transaction_id, plaid_account_id, category, pending)
       VALUES (@date, @description, @amount, 'manual', NULL, NULL, NULL, 0)`
    )
    .run(input);
  return getTransaction(result.lastInsertRowid as number)!;
}

/** Returns undefined if the transaction doesn't exist or isn't manually sourced
 *  (Plaid-synced rows are edit-locked so they never silently diverge from bank truth). */
export function updateManualTransaction(
  id: number,
  input: Partial<{ date: string; description: string; amount: number }>
): Transaction | undefined {
  const existing = getTransaction(id);
  if (!existing || existing.source !== "manual") return undefined;
  const merged = {
    id,
    date: input.date ?? existing.date,
    description: input.description ?? existing.description,
    amount: input.amount ?? existing.amount,
  };
  getDb().prepare(
    "UPDATE transactions SET date = @date, description = @description, amount = @amount, updated_at = datetime('now') WHERE id = @id"
  ).run(merged);
  return getTransaction(id);
}

/** Delete is allowed regardless of source — an explicit user override, e.g. to
 *  remove a stale manual entry that Plaid later synced for real. */
export function deleteTransaction(id: number): void {
  getDb().prepare("DELETE FROM transactions WHERE id = ?").run(id);
}

/** Upserts a Plaid-synced transaction, keyed on plaid_transaction_id so
 *  re-syncing (e.g. pending -> posted updates) never creates duplicates. */
export function upsertPlaidTransaction(input: {
  plaidTransactionId: string;
  plaidAccountId: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  pending: boolean;
}): void {
  getDb().prepare(
    `INSERT INTO transactions (date, description, amount, source, plaid_transaction_id, plaid_account_id, category, pending)
     VALUES (@date, @description, @amount, 'plaid', @plaidTransactionId, @plaidAccountId, @category, @pending)
     ON CONFLICT(plaid_transaction_id) DO UPDATE SET
       date = excluded.date,
       description = excluded.description,
       amount = excluded.amount,
       category = excluded.category,
       pending = excluded.pending,
       updated_at = datetime('now')`
  ).run({ ...input, pending: input.pending ? 1 : 0 });
}

export function deleteByPlaidTransactionId(plaidTransactionId: string): void {
  getDb().prepare("DELETE FROM transactions WHERE plaid_transaction_id = ?").run(plaidTransactionId);
}
