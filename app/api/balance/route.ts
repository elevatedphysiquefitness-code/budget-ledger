import { NextResponse } from "next/server";
import { getCurrentBalance } from "@/lib/repositories/balanceRepo";
import { setSetting } from "@/lib/repositories/settingsRepo";

export async function GET() {
  return NextResponse.json(getCurrentBalance());
}

// Only takes effect while not connected to Plaid (see getCurrentBalance) —
// the live-synced balance always wins once a bank is linked and synced.
export async function PUT(request: Request) {
  const body = await request.json();
  setSetting("current_account_balance_manual_override", String(Number(body.balance) || 0));
  return NextResponse.json(getCurrentBalance());
}
