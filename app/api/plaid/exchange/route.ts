import { NextResponse } from "next/server";
import { getPlaidClient, isPlaidConfigured } from "@/lib/plaid";
import { EncryptionKeyMissingError } from "@/lib/crypto";
import { savePlaidItem, upsertAccount, getPlaidItem } from "@/lib/repositories/plaidItemsRepo";

export async function POST(request: Request) {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "not_connected" }, { status: 503 });
  }

  const body = await request.json();
  const client = getPlaidClient();

  try {
    const exchange = await client.itemPublicTokenExchange({ public_token: body.publicToken });
    const { access_token: accessToken, item_id: itemId } = exchange.data;

    const item = savePlaidItem({
      itemId,
      accessToken,
      institutionName: body.institutionName ?? null,
    });

    const accountsResponse = await client.accountsGet({ access_token: accessToken });
    for (const account of accountsResponse.data.accounts) {
      upsertAccount({
        plaidItemDbId: item.id,
        plaidAccountId: account.account_id,
        name: account.name,
        officialName: account.official_name ?? null,
        type: account.type,
        subtype: account.subtype ?? null,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
      });
    }

    return NextResponse.json({ itemId, institutionName: getPlaidItem()?.institutionName ?? null });
  } catch (error) {
    if (error instanceof EncryptionKeyMissingError) {
      return NextResponse.json({ error: "encryption_key_missing", message: error.message }, { status: 500 });
    }
    throw error;
  }
}
