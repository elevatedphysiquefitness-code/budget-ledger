import clsx from "clsx";
import type { Bill } from "@/types/domain";
import LedgerAmount from "@/components/ledger/LedgerAmount";

export default function BillRow({
  bill,
  onTogglePaid,
  onEdit,
  onDelete,
}: {
  bill: Bill;
  onTogglePaid: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={onTogglePaid}
        aria-label={bill.paid ? "Mark unpaid" : "Mark paid"}
        className={clsx(
          "h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
          bill.paid ? "bg-green border-green" : "border-border"
        )}
      >
        {bill.paid && <span className="text-background text-xs">✓</span>}
      </button>

      <button onClick={onEdit} className="flex-1 text-left min-w-0">
        <p className="font-medium truncate">{bill.name}</p>
        <p className="text-xs text-muted">
          {bill.dueDay !== null ? `Due on the ${bill.dueDay}${ordinalSuffix(bill.dueDay)}` : "Not scheduled"}
        </p>
      </button>

      <LedgerAmount value={bill.amount} className={clsx(bill.paid && "text-muted line-through")} />

      <button onClick={onDelete} aria-label="Delete bill" className="text-muted hover:text-red text-sm">
        ✕
      </button>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}
