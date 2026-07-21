import type { Card } from "@/types/domain";
import LedgerAmount from "@/components/ledger/LedgerAmount";
import UtilizationBar from "@/components/cards/UtilizationBar";

export default function CardRow({
  card,
  onEdit,
  onDelete,
}: {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onEdit} className="text-left">
          <p className="font-medium">{card.name}</p>
          <p className="text-xs text-muted">{card.apr}% APR</p>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <LedgerAmount value={card.balance} />
            <p className="text-xs text-muted font-mono">/ {card.creditLimit.toLocaleString()}</p>
          </div>
          <button onClick={onDelete} aria-label="Delete card" className="text-muted hover:text-red text-sm">
            ✕
          </button>
        </div>
      </div>
      <UtilizationBar balance={card.balance} limit={card.creditLimit} />
    </div>
  );
}
