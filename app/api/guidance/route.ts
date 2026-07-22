import { NextResponse } from "next/server";
import { listCards } from "@/lib/repositories/cardsRepo";
import { listBills } from "@/lib/repositories/billsRepo";
import { getPaySchedule } from "@/lib/repositories/incomeRepo";
import { getAllocation } from "@/lib/repositories/allocationRepo";
import { getSettingNumber } from "@/lib/repositories/settingsRepo";
import { computeAllocation } from "@/lib/computations/allocator";
import { round2 } from "@/lib/computations/dateUtils";
import {
  compareDebtStrategies,
  computeBudgetBenchmarks,
  projectSavingsToTarget,
} from "@/lib/computations/guidance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const cards = listCards();
  const bills = listBills();
  const income = getPaySchedule();
  const allocation = getAllocation();

  const monthlyIncome = income.monthlyAverageNet ?? income.netPerPaycheck;
  const unpaidBills = bills.filter((b) => !b.paid);
  const allocationResult = computeAllocation(monthlyIncome, unpaidBills, allocation);

  const extraPaymentParam = searchParams.get("extraPayment");
  const extraPayment =
    extraPaymentParam !== null ? Number(extraPaymentParam) : allocation.extraTowardDebt;

  const debtComparison = compareDebtStrategies(
    cards.map((c) => ({ id: c.id, name: c.name, balance: c.balance, apr: c.apr })),
    extraPayment
  );

  const savingsBalance = getSettingNumber("savings_balance", 0);
  const targetMonths = getSettingNumber("emergency_fund_target_months", 3);
  const monthlyEssentialExpenses = round2(bills.reduce((sum, b) => sum + b.amount, 0));
  const emergencyFundTargetAmount = round2(monthlyEssentialExpenses * targetMonths);

  const emergencyFund = {
    ...projectSavingsToTarget(
      savingsBalance,
      allocation.savings,
      allocation.savingsApy,
      emergencyFundTargetAmount
    ),
    targetMonths,
    monthlyEssentialExpenses,
  };

  const budgetBenchmarks = computeBudgetBenchmarks(allocationResult.leftover, allocation);

  return NextResponse.json({ debtComparison, emergencyFund, budgetBenchmarks });
}
