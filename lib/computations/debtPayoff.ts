import { addMonths, isoMonth, round2 } from "./dateUtils";

export interface DebtCard {
  id: number;
  name: string;
  balance: number;
  apr: number;
}

export interface DebtMonthSnapshot {
  monthIndex: number;
  date: string;
  balances: Record<number, number>;
  totalBalance: number;
  interestPaidThisMonth: number;
}

export interface DebtPayoffResult {
  months: DebtMonthSnapshot[];
  debtFreeDate: string | null;
  totalInterestPaid: number;
  totalMonths: number;
}

export type DebtPayoffStrategy = "avalanche" | "snowball";

export interface DebtPayoffOptions {
  /** Minimum-payment floor in dollars, used as a simulation input (not real card terms). */
  minPaymentFloor?: number;
  /** Minimum payment as a fraction of balance, used alongside the floor (whichever is larger). */
  minPaymentPercent?: number;
  maxMonths?: number;
  startDate?: Date;
  /** avalanche = highest APR first (mathematically optimal); snowball = smallest
   *  balance first (faster early wins, usually costs a bit more interest). */
  strategy?: DebtPayoffStrategy;
}

const EPSILON = 0.005;

/**
 * Minimum payments on every card every month; the extra payment goes to
 * whichever card the chosen strategy prioritizes, re-evaluated each month as
 * cards get paid off (waterfalls to the next card within the same month if
 * one zeroes out with extra left over).
 */
export function simulateDebtPayoff(
  cards: DebtCard[],
  extraPaymentPerMonth: number,
  options: DebtPayoffOptions = {}
): DebtPayoffResult {
  const {
    minPaymentFloor = 25,
    minPaymentPercent = 0.02,
    maxMonths = 600,
    startDate = new Date(),
    strategy = "avalanche",
  } = options;

  const balances = new Map<number, number>(cards.map((c) => [c.id, c.balance]));
  const aprById = new Map<number, number>(cards.map((c) => [c.id, c.apr]));

  const months: DebtMonthSnapshot[] = [];
  let totalInterestPaid = 0;
  let debtFreeDate: string | null = null;

  for (let monthIndex = 0; monthIndex < maxMonths; monthIndex++) {
    const remainingCards = cards.filter((c) => (balances.get(c.id) ?? 0) > EPSILON);
    if (remainingCards.length === 0) {
      debtFreeDate = isoMonth(addMonths(startDate, monthIndex));
      break;
    }

    let interestThisMonth = 0;
    for (const card of remainingCards) {
      const bal = balances.get(card.id)!;
      const monthlyRate = card.apr / 100 / 12;
      const interest = bal * monthlyRate;
      interestThisMonth += interest;
      balances.set(card.id, bal + interest);
    }
    totalInterestPaid += interestThisMonth;

    for (const card of remainingCards) {
      const bal = balances.get(card.id)!;
      const minPayment = Math.min(bal, Math.max(minPaymentFloor, bal * minPaymentPercent));
      balances.set(card.id, bal - minPayment);
    }

    let extra = extraPaymentPerMonth;
    const priorityOrder = [...remainingCards].sort((a, b) =>
      strategy === "snowball"
        ? balances.get(a.id)! - balances.get(b.id)!
        : aprById.get(b.id)! - aprById.get(a.id)!
    );
    for (const card of priorityOrder) {
      if (extra <= 0) break;
      const bal = balances.get(card.id)!;
      if (bal <= EPSILON) continue;
      const pay = Math.min(bal, extra);
      balances.set(card.id, bal - pay);
      extra -= pay;
    }

    const snapshotDate = addMonths(startDate, monthIndex + 1);
    const balancesSnapshot: Record<number, number> = {};
    let totalBalance = 0;
    for (const card of cards) {
      const b = Math.max(0, round2(balances.get(card.id) ?? 0));
      balancesSnapshot[card.id] = b;
      totalBalance += b;
    }
    totalBalance = round2(totalBalance);

    months.push({
      monthIndex,
      date: isoMonth(snapshotDate),
      balances: balancesSnapshot,
      totalBalance,
      interestPaidThisMonth: round2(interestThisMonth),
    });

    if (totalBalance <= EPSILON) {
      debtFreeDate = isoMonth(snapshotDate);
      break;
    }
  }

  return {
    months,
    debtFreeDate,
    totalInterestPaid: round2(totalInterestPaid),
    totalMonths: months.length,
  };
}

/** Thin wrapper kept for existing callers (`/api/projections/debt`, `/projections`). */
export function simulateDebtPayoffAvalanche(
  cards: DebtCard[],
  extraPaymentPerMonth: number,
  options: DebtPayoffOptions = {}
): DebtPayoffResult {
  return simulateDebtPayoff(cards, extraPaymentPerMonth, { ...options, strategy: "avalanche" });
}
