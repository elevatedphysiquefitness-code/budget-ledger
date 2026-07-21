import type { AllocationTargets } from "@/types/domain";

export interface AllocationResult {
  income: number;
  unpaidBillsTotal: number;
  leftover: number;
  targets: AllocationTargets;
  targetsTotal: number;
  remainderAfterTargets: number;
  overAllocated: boolean;
}

export function computeAllocation(
  income: number,
  unpaidBills: { amount: number }[],
  targets: AllocationTargets
): AllocationResult {
  const unpaidBillsTotal = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const leftover = income - unpaidBillsTotal;
  const targetsTotal =
    targets.savings + targets.food + targets.hobbies + targets.other + targets.extraTowardDebt;
  const remainderAfterTargets = leftover - targetsTotal;

  return {
    income,
    unpaidBillsTotal,
    leftover,
    targets,
    targetsTotal,
    remainderAfterTargets,
    overAllocated: targetsTotal > leftover,
  };
}
