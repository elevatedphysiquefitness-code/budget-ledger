import LedgerAmount from "@/components/ledger/LedgerAmount";
import ProgressBar from "@/components/ledger/ProgressBar";
import type { CategoryTotal } from "@/lib/computations/spendingByCategory";

export default function CategoryRow({ category, totalSpent }: { category: CategoryTotal; totalSpent: number }) {
  const ratio = totalSpent > 0 ? category.total / totalSpent : 0;
  return (
    <div className="py-2.5">
      <div className="flex justify-between items-baseline text-sm mb-1">
        <span>
          {category.label} <span className="text-muted text-xs">· {category.count}</span>
        </span>
        <LedgerAmount value={category.total} className="text-sm" />
      </div>
      <ProgressBar ratio={ratio} color="accent" />
    </div>
  );
}
