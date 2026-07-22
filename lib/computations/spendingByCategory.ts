import { round2 } from "./dateUtils";

export interface CategoryTotal {
  category: string;
  label: string;
  total: number;
  count: number;
}

export interface SpendingByCategoryResult {
  categories: CategoryTotal[];
  totalSpent: number;
}

function formatCategoryLabel(category: string): string {
  if (category === "OTHER") return "Other / Uncategorized";
  return category
    .split("_")
    .map((word) => (word === "AND" ? "&" : word.charAt(0) + word.slice(1).toLowerCase()))
    .join(" ");
}

/** Only counts outflows (this app's convention: positive = inflow). Manual
 *  transactions (no Plaid category) bucket into "Other" rather than being
 *  dropped, so the breakdown still accounts for all spending. */
export function computeSpendingByCategory(
  transactions: { amount: number; category: string | null }[]
): SpendingByCategoryResult {
  const totals = new Map<string, { total: number; count: number }>();

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const key = t.category ?? "OTHER";
    const existing = totals.get(key) ?? { total: 0, count: 0 };
    existing.total += Math.abs(t.amount);
    existing.count += 1;
    totals.set(key, existing);
  }

  const categories = [...totals.entries()]
    .map(([category, { total, count }]) => ({
      category,
      label: formatCategoryLabel(category),
      total: round2(total),
      count,
    }))
    .sort((a, b) => b.total - a.total);

  const totalSpent = round2(categories.reduce((sum, c) => sum + c.total, 0));

  return { categories, totalSpent };
}
