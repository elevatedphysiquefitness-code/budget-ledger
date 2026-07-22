import { NextResponse } from "next/server";
import { listTransactionsInRange } from "@/lib/repositories/transactionsRepo";
import { computeSpendingByCategory } from "@/lib/computations/spendingByCategory";
import { addDays, isoDate } from "@/lib/computations/dateUtils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  const now = new Date();
  const end = isoDate(now);
  let start: string;
  if (period === "30" || period === "90") {
    start = isoDate(addDays(now, -Number(period)));
  } else {
    start = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  const transactions = listTransactionsInRange(start, end);
  const result = computeSpendingByCategory(transactions);

  return NextResponse.json({ ...result, periodStart: start, periodEnd: end });
}
