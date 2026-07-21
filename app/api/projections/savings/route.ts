import { NextResponse } from "next/server";
import { getAllocation } from "@/lib/repositories/allocationRepo";
import { projectSavingsGrowth } from "@/lib/computations/savingsGrowth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startingBalance = Number(searchParams.get("startingBalance") ?? "0");

  const allocation = getAllocation();
  const result = projectSavingsGrowth(startingBalance, allocation.savings, allocation.savingsApy);
  return NextResponse.json(result);
}
