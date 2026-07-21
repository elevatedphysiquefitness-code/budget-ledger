import { getSetting, getSettingNumber } from "@/lib/repositories/settingsRepo";
import { getPlaidItem } from "@/lib/repositories/plaidItemsRepo";

export interface CurrentBalance {
  balance: number;
  connected: boolean;
}

/** Prefers the live Plaid-synced balance when linked and synced at least
 *  once; otherwise falls back to the manually entered last-known balance
 *  rather than guessing. */
export function getCurrentBalance(): CurrentBalance {
  const item = getPlaidItem();
  const plaidBalance = getSetting("plaid_checking_balance");

  if (item && plaidBalance !== undefined) {
    return { balance: Number(plaidBalance), connected: true };
  }

  return {
    balance: getSettingNumber("current_account_balance_manual_override", 0),
    connected: false,
  };
}
