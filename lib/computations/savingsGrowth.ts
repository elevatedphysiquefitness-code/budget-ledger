import { addMonths, isoMonth, round2 } from "./dateUtils";

export interface SavingsProjectionPoint {
  monthIndex: number;
  date: string;
  balance: number;
}

export interface SavingsProjectionResult {
  points: SavingsProjectionPoint[];
  milestones: {
    sixMonth: number;
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
}

/** Compounds monthly at the given APY, with a fixed monthly contribution added after growth. */
export function projectSavingsGrowth(
  startingBalance: number,
  monthlyContribution: number,
  annualPercentageYield: number,
  startDate: Date = new Date()
): SavingsProjectionResult {
  const monthlyRate = annualPercentageYield / 100 / 12;
  const points: SavingsProjectionPoint[] = [];
  let balance = startingBalance;

  for (let monthIndex = 1; monthIndex <= 60; monthIndex++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    points.push({
      monthIndex,
      date: isoMonth(addMonths(startDate, monthIndex)),
      balance: round2(balance),
    });
  }

  const at = (n: number) => points[n - 1].balance;

  return {
    points,
    milestones: {
      sixMonth: at(6),
      oneYear: at(12),
      threeYear: at(36),
      fiveYear: at(60),
    },
  };
}
