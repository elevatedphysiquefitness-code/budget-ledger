import type { Bill } from "@/types/domain";

/**
 * The cycle a bill due on `dueDay` currently belongs to, expressed as "YYYY-MM".
 * If `asOf` is on or after `dueDay` this month, the bill has already entered
 * next month's cycle (its due date for the *next* payment has passed forward).
 */
export function currentCycleKey(dueDay: number, asOf: Date): string {
  const year = asOf.getFullYear();
  const month = asOf.getMonth(); // 0-indexed
  const day = asOf.getDate();

  const cycleMonth = day >= dueDay ? month + 1 : month;
  const cycleDate = new Date(year, cycleMonth, 1);
  return `${cycleDate.getFullYear()}-${String(cycleDate.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A bill with no due day (not yet scheduled) never auto-resets — the user
 * controls its paid state manually until a due day is set.
 */
export function resolveBillPaidState(bill: Bill, asOf: Date): Bill {
  if (bill.dueDay === null || !bill.paid) {
    return bill;
  }
  const nowCycle = currentCycleKey(bill.dueDay, asOf);
  if (bill.paidCycleKey === nowCycle) {
    return bill;
  }
  return { ...bill, paid: false, paidCycleKey: null };
}

/** Returns only the bills whose paid state changed, for the caller to persist. */
export function reconcileBillCycles(bills: Bill[], asOf: Date): Bill[] {
  const changed: Bill[] = [];
  for (const bill of bills) {
    const resolved = resolveBillPaidState(bill, asOf);
    if (resolved.paid !== bill.paid || resolved.paidCycleKey !== bill.paidCycleKey) {
      changed.push(resolved);
    }
  }
  return changed;
}
