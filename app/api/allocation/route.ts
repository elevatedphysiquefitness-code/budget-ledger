import { NextResponse } from "next/server";
import { getAllocation, updateAllocation } from "@/lib/repositories/allocationRepo";

export async function GET() {
  return NextResponse.json(getAllocation());
}

export async function PUT(request: Request) {
  const body = await request.json();
  const allocation = updateAllocation({
    savings: Number(body.savings),
    food: Number(body.food),
    hobbies: Number(body.hobbies),
    other: Number(body.other),
    extraTowardDebt: Number(body.extraTowardDebt),
    savingsApy: Number(body.savingsApy),
  });
  return NextResponse.json(allocation);
}
