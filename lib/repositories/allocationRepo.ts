import { db } from "@/db/client";
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

export function getAllocation(): AllocationTargets {
  const row = db.prepare("SELECT * FROM allocation_targets WHERE id = 1").get() as AllocationRow;
  return rowToAllocation(row);
}

export function updateAllocation(input: AllocationTargets): AllocationTargets {
  db.prepare(
    `UPDATE allocation_targets
     SET savings = @savings, food = @food, hobbies = @hobbies, other = @other,
         extra_toward_debt = @extraTowardDebt, savings_apy = @savingsApy, updated_at = datetime('now')
     WHERE id = 1`
  ).run(input);
  return getAllocation();
}
