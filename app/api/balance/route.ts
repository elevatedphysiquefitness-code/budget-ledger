import { NextResponse } from "next/server";
import { getSettingNumber } from "@/lib/repositories/settingsRepo";

export async function GET() {
  // Plaid integration (task 10) will prefer a live-synced balance here when
  // connected; until then this is the manually-entered last-known balance.
  const balance = getSettingNumber("current_account_balance_manual_override", 0);
  return NextResponse.json({ balance, connected: false });
}
