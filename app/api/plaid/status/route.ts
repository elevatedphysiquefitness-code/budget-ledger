import { NextResponse } from "next/server";
import { isPlaidConfigured } from "@/lib/plaid";
import { getPlaidItem } from "@/lib/repositories/plaidItemsRepo";

export async function GET() {
  const configured = isPlaidConfigured();
  const item = configured ? getPlaidItem() : undefined;

  return NextResponse.json({
    configured,
    linked: Boolean(item),
    institutionName: item?.institutionName ?? null,
    lastSyncedAt: item?.lastSyncedAt ?? null,
  });
}
