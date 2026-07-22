import { NextResponse } from "next/server";
import { getSettingNumber, setSetting } from "@/lib/repositories/settingsRepo";

export async function GET() {
  return NextResponse.json({
    balance: getSettingNumber("savings_balance", 0),
    targetMonths: getSettingNumber("emergency_fund_target_months", 3),
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  if (body.balance !== undefined) {
    setSetting("savings_balance", String(Number(body.balance) || 0));
  }
  if (body.targetMonths !== undefined) {
    setSetting("emergency_fund_target_months", String(Number(body.targetMonths) || 3));
  }
  return NextResponse.json({
    balance: getSettingNumber("savings_balance", 0),
    targetMonths: getSettingNumber("emergency_fund_target_months", 3),
  });
}
