import { addDays, isoDate, round2 } from "./dateUtils";

export interface DayForecastEvent {
  type: "bill" | "payday";
  label: string;
  amount: number;
}

export interface DayForecast {
  date: string;
  projectedBalance: number;
  events: DayForecastEvent[];
  warning: "negative" | "low" | null;
}

export interface CashFlowForecastResult {
  days: DayForecast[];
  firstNegativeDate: string | null;
  firstLowBalanceDate: string | null;
  worstBalance: number;
  worstBalanceDate: string;
}

export interface CashFlowForecastParams {
  startingBalance: number;
  asOf: Date;
  /** UI restricts this to 30/60/90; the simulation itself accepts any positive day count. */
  horizonDays: number;
  bills: { name: string; amount: number; dueDay: number | null; paid: boolean }[];
  paySchedule: { nextPayDate: string; netPerPaycheck: number; payIntervalDays: number };
  /**
   * Shown by the UI as "recent activity" annotation only — never used to
   * fabricate a projected discretionary-spend average. The simulation only
   * ever advances the balance using real scheduled bills and paydays.
   */
  recentTransactions?: { date: string; amount: number }[];
}

const LOW_BALANCE_THRESHOLD = 100;

export function forecastCashFlow(params: CashFlowForecastParams): CashFlowForecastResult {
  const { startingBalance, asOf, horizonDays, bills, paySchedule } = params;

  const horizonEndExclusive = addDays(asOf, horizonDays);
  const paydays = new Set(
    generatePaydays(
      parseIsoDate(paySchedule.nextPayDate),
      paySchedule.payIntervalDays,
      asOf,
      horizonEndExclusive
    ).map(isoDate)
  );

  const billsWithDueDay = bills.filter((b) => b.dueDay !== null) as (typeof bills[number] & {
    dueDay: number;
  })[];
  const firstOccurrenceHandled = new Set<string>();

  let balance = startingBalance;
  const days: DayForecast[] = [];
  let firstNegativeDate: string | null = null;
  let firstLowBalanceDate: string | null = null;
  let worstBalance = startingBalance;
  let worstBalanceDate = isoDate(asOf);

  for (let i = 0; i < horizonDays; i++) {
    const day = addDays(asOf, i);
    const dayIso = isoDate(day);
    const events: DayForecastEvent[] = [];

    for (const bill of billsWithDueDay) {
      if (day.getDate() !== bill.dueDay) continue;
      const key = `${bill.name}-${bill.dueDay}`;
      const isFirstOccurrence = !firstOccurrenceHandled.has(key);
      if (isFirstOccurrence) {
        firstOccurrenceHandled.add(key);
        if (bill.paid) continue; // already paid this cycle — no outflow
      }
      balance -= bill.amount;
      events.push({ type: "bill", label: bill.name, amount: -bill.amount });
    }

    if (paydays.has(dayIso)) {
      balance += paySchedule.netPerPaycheck;
      events.push({ type: "payday", label: "Payday", amount: paySchedule.netPerPaycheck });
    }

    let warning: DayForecast["warning"] = null;
    if (balance < 0) {
      warning = "negative";
      if (!firstNegativeDate) firstNegativeDate = dayIso;
    } else if (balance < LOW_BALANCE_THRESHOLD) {
      warning = "low";
      if (!firstLowBalanceDate) firstLowBalanceDate = dayIso;
    }

    if (balance < worstBalance) {
      worstBalance = balance;
      worstBalanceDate = dayIso;
    }

    days.push({ date: dayIso, projectedBalance: round2(balance), events, warning });
  }

  return {
    days,
    firstNegativeDate,
    firstLowBalanceDate,
    worstBalance: round2(worstBalance),
    worstBalanceDate,
  };
}

function generatePaydays(
  nextPayDate: Date,
  intervalDays: number,
  asOf: Date,
  horizonEndExclusive: Date
): Date[] {
  const result: Date[] = [];
  let current = nextPayDate;
  while (current < asOf) {
    current = addDays(current, intervalDays);
  }
  while (current < horizonEndExclusive) {
    result.push(current);
    current = addDays(current, intervalDays);
  }
  return result;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
