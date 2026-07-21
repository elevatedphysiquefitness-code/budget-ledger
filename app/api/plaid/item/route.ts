import { NextResponse } from "next/server";
import { getPlaidClient, isPlaidConfigured } from "@/lib/plaid";
import { deletePlaidItem, getDecryptedAccessToken, getPlaidItem } from "@/lib/repositories/plaidItemsRepo";

export async function DELETE() {
  const item = getPlaidItem();
  if (!item) return new NextResponse(null, { status: 204 });

  if (isPlaidConfigured()) {
    const accessToken = getDecryptedAccessToken();
    if (accessToken) {
      const client = getPlaidClient();
      await client.itemRemove({ access_token: accessToken });
    }
  }

  // Historical Plaid-synced transactions are kept — unlinking shouldn't
  // retroactively erase real transaction history.
  deletePlaidItem(item.itemId);
  return new NextResponse(null, { status: 204 });
}
