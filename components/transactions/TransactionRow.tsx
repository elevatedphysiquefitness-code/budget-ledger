import clsx from "clsx";
import type { TransactionWithBalance } from "@/lib/repositories/transactionsRepo";
import LedgerAmount from "@/components/ledger/LedgerAmount";

export default function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: TransactionWithBalance;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const editable = transaction.source === "manual";

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={editable ? onEdit : undefined}
        disabled={!editable}
        className="flex-1 text-left min-w-0"
      >
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{transaction.description}</p>
          {transaction.source === "plaid" && (
            <span className="shrink-0 rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted">
              synced
            </span>
          )}
        </div>
        <p className="text-xs text-muted">{transaction.date}</p>
      </button>

      <div className="text-right">
        <LedgerAmount value={transaction.amount} variant="signed" className="text-sm" />
        <p className="text-xs text-muted font-mono">
          bal <LedgerAmount value={transaction.runningBalance} className="text-xs" />
        </p>
      </div>

      <button
        onClick={onDelete}
        aria-label="Delete transaction"
        className={clsx("text-muted hover:text-red text-sm shrink-0")}
      >
        ✕
      </button>
    </div>
  );
}
