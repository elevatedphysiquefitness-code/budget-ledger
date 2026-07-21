import { NextResponse } from "next/server";
import { getPlaidClient, isPlaidConfigured } from "@/lib/plaid";
import {
  getDecryptedAccessToken,
  getPlaidItem,
  updateSyncState,
  upsertAccount,
} from "@/lib/repositories/plaidItemsRepo";
import {
  deleteByPlaidTransactionId,
  upsertPlaidTransaction,
} from "@/lib/repositories/transactionsRepo";
import { setSetting } from "@/lib/repositories/settingsRepo";

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "not_connected" }, { status: 503 });
  }

  const item = getPlaidItem();
  const accessToken = getDecryptedAccessToken();
  if (!item || !accessToken) {
    return NextResponse.json({ error: "not_linked" }, { status: 409 });
  }

  const client = getPlaidClient();

  let cursor = item.cursor ?? undefined;
  let added = 0;
  let modified = 0;
  let removed = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await client.transactionsSync({ access_token: accessToken, cursor });

    // Plaid's sign convention is the opposite of ours: positive = money out.
    // Normalize to this app's convention (positive = inflow) here, at the boundary.
    for (const t of response.data.added) {
      upsertPlaidTransaction({
        plaidTransactionId: t.transaction_id,
        plaidAccountId: t.account_id,
        date: t.date,
        description: t.merchant_name ?? t.name,
        amount: -t.amount,
        category: t.personal_finance_category?.primary ?? null,
        pending: t.pending,
      });
      added++;
    }
    for (const t of response.data.modified) {
      upsertPlaidTransaction({
        plaidTransactionId: t.transaction_id,
        plaidAccountId: t.account_id,
        date: t.date,
        description: t.merchant_name ?? t.name,
        amount: -t.amount,
        category: t.personal_finance_category?.primary ?? null,
        pending: t.pending,
      });
      modified++;
    }
    for (const t of response.data.removed) {
      if (t.transaction_id) deleteByPlaidTransactionId(t.transaction_id);
      removed++;
    }

    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  updateSyncState(item.itemId, cursor ?? null);

  const accountsResponse = await client.accountsBalanceGet({ access_token: accessToken });
  let newBalance: number | null = null;
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
    if (account.type === "depository" && account.balances.current !== null) {
      newBalance = account.balances.current;
    }
  }
  if (newBalance !== null) {
    setSetting("plaid_checking_balance", String(newBalance));
  }

  return NextResponse.json({ added, modified, removed, newBalance });
}
