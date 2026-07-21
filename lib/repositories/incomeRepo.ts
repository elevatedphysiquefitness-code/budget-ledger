import { db } from "@/db/client";
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

export function getPaySchedule(): PaySchedule {
  const row = db.prepare("SELECT * FROM pay_schedule WHERE id = 1").get() as PayScheduleRow;
  return rowToPaySchedule(row);
}

export function updatePaySchedule(input: PaySchedule): PaySchedule {
  db.prepare(
    `UPDATE pay_schedule
     SET hourly_rate = @hourlyRate, pay_frequency = @payFrequency, net_per_paycheck = @netPerPaycheck,
         monthly_average_net = @monthlyAverageNet, federal_withholding = @federalWithholding,
         next_pay_date = @nextPayDate, pay_interval_days = @payIntervalDays, updated_at = datetime('now')
     WHERE id = 1`
  ).run(input);
  return getPaySchedule();
}
