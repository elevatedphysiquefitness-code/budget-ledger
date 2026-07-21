import { getDb } from "@/db/client";
import type { AllocationTargets } from "@/types/domain";

interface AllocationRow {
  savings: number;
  food: number;
  hobbies: number;
  other: number;
  extra_toward_debt: number;
  savings_apy: number;
}

function rowToAllocation(row: AllocationRow): AllocationTargets {
  return {
    savings: row.savings,
    food: row.food,
    hobbies: row.hobbies,
    other: row.other,
    extraTowardDebt: row.extra_toward_debt,
    savingsApy: row.savings_apy,
  };
}

const DEFAULT_ALLOCATION: AllocationTargets = {
  savings: 0,
  food: 0,
  hobbies: 0,
  other: 0,
  extraTowardDebt: 0,
  savingsApy: 0,
};

/** On a fresh install there's no allocation_targets row yet — create a
 *  zeroed default (editable immediately via the existing form) rather than
 *  requiring every caller to handle "not configured yet" as a special case. */
export function getAllocation(): AllocationTargets {
  const row = getDb().prepare("SELECT * FROM allocation_targets WHERE id = 1").get() as
    | AllocationRow
    | undefined;
  if (!row) return updateAllocation(DEFAULT_ALLOCATION);
  return rowToAllocation(row);
}

export function updateAllocation(input: AllocationTargets): AllocationTargets {
  getDb()
    .prepare(
      `INSERT INTO allocation_targets (id, savings, food, hobbies, other, extra_toward_debt, savings_apy)
       VALUES (1, @savings, @food, @hobbies, @other, @extraTowardDebt, @savingsApy)
       ON CONFLICT(id) DO UPDATE SET
         savings = excluded.savings, food = excluded.food, hobbies = excluded.hobbies,
         other = excluded.other, extra_toward_debt = excluded.extra_toward_debt,
         savings_apy = excluded.savings_apy, updated_at = datetime('now')`
    )
    .run(input);
  const row = getDb().prepare("SELECT * FROM allocation_targets WHERE id = 1").get() as AllocationRow;
  return rowToAllocation(row);
}
