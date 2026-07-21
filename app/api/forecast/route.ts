import { NextResponse } from "next/server";
import { listBills } from "@/lib/repositories/billsRepo";
import { getPaySchedule } from "@/lib/repositories/incomeRepo";
import { getCurrentBalance } from "@/lib/repositories/balanceRepo";
import { forecastCashFlow } from "@/lib/computations/cashFlowForecast";

const VALID_HORIZONS = [30, 60, 90] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const horizonParam = Number(searchParams.get("horizonDays") ?? "30");
  const horizonDays = (VALID_HORIZONS as readonly number[]).includes(horizonParam)
    ? (horizonParam as 30 | 60 | 90)
    : 30;

  const bills = listBills();
  const paySchedule = getPaySchedule();
  const { balance: startingBalance } = getCurrentBalance();

  const result = forecastCashFlow({
    startingBalance,
    asOf: new Date(),
    horizonDays,
    bills: bills.map((b) => ({ name: b.name, amount: b.amount, dueDay: b.dueDay, paid: b.paid })),
    paySchedule: {
      nextPayDate: paySchedule.nextPayDate,
      netPerPaycheck: paySchedule.netPerPaycheck,
      payIntervalDays: paySchedule.payIntervalDays,
    },
  });

  return NextResponse.json(result);
}
