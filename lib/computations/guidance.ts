import { addMonths, isoMonth, round2 } from "./dateUtils";
import { type DebtCard, type DebtPayoffOptions, type DebtPayoffResult, simulateDebtPayoff } from "./debtPayoff";
import type { AllocationTargets } from "@/types/domain";

export interface DebtStrategyComparison {
  avalanche: DebtPayoffResult;
  snowball: DebtPayoffResult;
  /** snowball's total interest minus avalanche's — how much avalanche saves (can be 0). */
  interestSavedByAvalanche: number;
}

/** Runs the same simulation twice, once per strategy, for a side-by-side comparison. */
export function compareDebtStrategies(
  cards: DebtCard[],
  extraPaymentPerMonth: number,
  options: Omit<DebtPayoffOptions, "strategy"> = {}
): DebtStrategyComparison {
  const avalanche = simulateDebtPayoff(cards, extraPaymentPerMonth, { ...options, strategy: "avalanche" });
  const snowball = simulateDebtPayoff(cards, extraPaymentPerMonth, { ...options, strategy: "snowball" });
  return {
    avalanche,
    snowball,
    interestSavedByAvalanche: round2(snowball.totalInterestPaid - avalanche.totalInterestPaid),
  };
}

export interface SavingsTargetResult {
  targetAmount: number;
  currentBalance: number;
  /** null if not reached within the 60-month simulation window. */
  monthsToTarget: number | null;
  targetDate: string | null;
  onTrack: boolean;
}

const MAX_MONTHS = 60;

/** Same month-by-month compounding as projectSavingsGrowth, but stops once the
 *  balance reaches targetAmount instead of running a fixed duration. */
export function projectSavingsToTarget(
  currentBalance: number,
  monthlyContribution: number,
  annualPercentageYield: number,
  targetAmount: number,
  startDate: Date = new Date()
): SavingsTargetResult {
  if (currentBalance >= targetAmount) {
    return {
      targetAmount: round2(targetAmount),
      currentBalance: round2(currentBalance),
      monthsToTarget: 0,
      targetDate: isoMonth(addMonths(startDate, 0)),
      onTrack: true,
    };
  }

  const monthlyRate = annualPercentageYield / 100 / 12;
  let balance = currentBalance;

  for (let monthIndex = 1; monthIndex <= MAX_MONTHS; monthIndex++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    if (balance >= targetAmount) {
      return {
        targetAmount: round2(targetAmount),
        currentBalance: round2(currentBalance),
        monthsToTarget: monthIndex,
        targetDate: isoMonth(addMonths(startDate, monthIndex)),
        onTrack: true,
      };
    }
  }

  return {
    targetAmount: round2(targetAmount),
    currentBalance: round2(currentBalance),
    monthsToTarget: null,
    targetDate: null,
    onTrack: false,
  };
}

export type BudgetBand = "low" | "within" | "high";

export interface BudgetCategoryBenchmark {
  amount: number;
  /** 0..1+, share of leftover income this category takes. */
  percentOfLeftover: number;
  /** Only set for categories with a defensible published guideline range. */
  band?: BudgetBand;
}

export interface BudgetBenchmarksResult {
  leftover: number;
  /** Combined "building wealth" bucket — commonly guided at 15-20% of leftover. */
  savingsAndDebt: BudgetCategoryBenchmark;
  /** Commonly guided at 10-15% of leftover for groceries + dining out. */
  food: BudgetCategoryBenchmark;
  /** No defensible general benchmark without household size/location — percentage only. */
  hobbies: BudgetCategoryBenchmark;
  other: BudgetCategoryBenchmark;
}

function classifyBand(percent: number, low: number, high: number): BudgetBand {
  if (percent < low) return "low";
  if (percent > high) return "high";
  return "within";
}

function pctOf(amount: number, leftover: number): number {
  return leftover > 0 ? amount / leftover : 0;
}

/** Informational only — these are common published guideline ranges, not
 *  personalized financial advice, and are shown alongside the user's actual
 *  numbers rather than as a directive. */
export function computeBudgetBenchmarks(
  leftover: number,
  targets: AllocationTargets
): BudgetBenchmarksResult {
  const savingsAndDebtAmount = targets.savings + targets.extraTowardDebt;
  const savingsAndDebtPct = pctOf(savingsAndDebtAmount, leftover);
  const foodPct = pctOf(targets.food, leftover);

  return {
    leftover: round2(leftover),
    savingsAndDebt: {
      amount: round2(savingsAndDebtAmount),
      percentOfLeftover: savingsAndDebtPct,
      band: classifyBand(savingsAndDebtPct, 0.15, 0.2),
    },
    food: {
      amount: round2(targets.food),
      percentOfLeftover: foodPct,
      band: classifyBand(foodPct, 0.1, 0.15),
    },
    hobbies: {
      amount: round2(targets.hobbies),
      percentOfLeftover: pctOf(targets.hobbies, leftover),
    },
    other: {
      amount: round2(targets.other),
      percentOfLeftover: pctOf(targets.other, leftover),
    },
  };
}
