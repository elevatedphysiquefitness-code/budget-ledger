import { getDb } from "@/db/client";
import type { FederalWithholding, PayFrequency, PaySchedule } from "@/types/domain";

interface PayScheduleRow {
  hourly_rate: number | null;
  pay_frequency: string;
  net_per_paycheck: number;
  monthly_average_net: number | null;
  federal_withholding: string;
  next_pay_date: string;
  pay_interval_days: number;
}

function rowToPaySchedule(row: PayScheduleRow): PaySchedule {
  return {
    hourlyRate: row.hourly_rate,
    payFrequency: row.pay_frequency as PayFrequency,
    netPerPaycheck: row.net_per_paycheck,
    monthlyAverageNet: row.monthly_average_net,
    federalWithholding: row.federal_withholding as FederalWithholding,
    nextPayDate: row.next_pay_date,
    payIntervalDays: row.pay_interval_days,
  };
}

const DEFAULT_PAY_SCHEDULE: PaySchedule = {
  hourlyRate: null,
  payFrequency: "biweekly",
  netPerPaycheck: 0,
  monthlyAverageNet: null,
  federalWithholding: "standard",
  nextPayDate: new Date().toISOString().slice(0, 10),
  payIntervalDays: 14,
};

/** On a fresh install there's no pay_schedule row yet — create a sensible
 *  zeroed default (editable immediately via the existing form) rather than
 *  requiring every caller to handle "not configured yet" as a special case. */
export function getPaySchedule(): PaySchedule {
  const row = getDb().prepare("SELECT * FROM pay_schedule WHERE id = 1").get() as
    | PayScheduleRow
    | undefined;
  if (!row) return updatePaySchedule(DEFAULT_PAY_SCHEDULE);
  return rowToPaySchedule(row);
}

export function updatePaySchedule(input: PaySchedule): PaySchedule {
  getDb()
    .prepare(
      `INSERT INTO pay_schedule (id, hourly_rate, pay_frequency, net_per_paycheck, monthly_average_net, federal_withholding, next_pay_date, pay_interval_days)
       VALUES (1, @hourlyRate, @payFrequency, @netPerPaycheck, @monthlyAverageNet, @federalWithholding, @nextPayDate, @payIntervalDays)
       ON CONFLICT(id) DO UPDATE SET
         hourly_rate = excluded.hourly_rate, pay_frequency = excluded.pay_frequency,
         net_per_paycheck = excluded.net_per_paycheck, monthly_average_net = excluded.monthly_average_net,
         federal_withholding = excluded.federal_withholding, next_pay_date = excluded.next_pay_date,
         pay_interval_days = excluded.pay_interval_days, updated_at = datetime('now')`
    )
    .run(input);
  const row = getDb().prepare("SELECT * FROM pay_schedule WHERE id = 1").get() as PayScheduleRow;
  return rowToPaySchedule(row);
}
