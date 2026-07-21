import { db } from "@/db/client";
import type { PlaidAccount, PlaidItem } from "@/types/domain";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

interface PlaidItemRow {
  id: number;
  item_id: string;
  access_token_encrypted: string;
  iv: string;
  auth_tag: string;
  institution_name: string | null;
  cursor: string | null;
  last_synced_at: string | null;
}

function rowToItem(row: PlaidItemRow): PlaidItem {
  return {
    id: row.id,
    itemId: row.item_id,
    institutionName: row.institution_name,
    cursor: row.cursor,
    lastSyncedAt: row.last_synced_at,
  };
}

/** Single-user app: at most one linked item is expected, so this returns the first. */
export function getPlaidItem(): PlaidItem | undefined {
  const row = db.prepare("SELECT * FROM plaid_item ORDER BY id LIMIT 1").get() as
    | PlaidItemRow
    | undefined;
  return row ? rowToItem(row) : undefined;
}

export function getDecryptedAccessToken(): string | undefined {
  const row = db.prepare("SELECT * FROM plaid_item ORDER BY id LIMIT 1").get() as
    | PlaidItemRow
    | undefined;
  if (!row) return undefined;
  return decryptSecret({
    ciphertext: row.access_token_encrypted,
    iv: row.iv,
    authTag: row.auth_tag,
  });
}

export function savePlaidItem(input: {
  itemId: string;
  accessToken: string;
  institutionName: string | null;
}): PlaidItem {
  const encrypted = encryptSecret(input.accessToken);
  db.prepare(
    `INSERT INTO plaid_item (item_id, access_token_encrypted, iv, auth_tag, institution_name)
     VALUES (@itemId, @ciphertext, @iv, @authTag, @institutionName)
     ON CONFLICT(item_id) DO UPDATE SET
       access_token_encrypted = excluded.access_token_encrypted,
       iv = excluded.iv,
       auth_tag = excluded.auth_tag,
       institution_name = excluded.institution_name`
  ).run({
    itemId: input.itemId,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    institutionName: input.institutionName,
  });
  return getPlaidItem()!;
}

export function updateSyncState(itemId: string, cursor: string | null): void {
  db.prepare(
    "UPDATE plaid_item SET cursor = @cursor, last_synced_at = datetime('now') WHERE item_id = @itemId"
  ).run({ cursor, itemId });
}

export function deletePlaidItem(itemId: string): void {
  db.prepare("DELETE FROM plaid_item WHERE item_id = ?").run(itemId);
}

interface AccountRow {
  id: number;
  plaid_item_id: number;
  plaid_account_id: string;
  name: string | null;
  official_name: string | null;
  type: string | null;
  subtype: string | null;
  current_balance: number | null;
  available_balance: number | null;
}

function rowToAccount(row: AccountRow): PlaidAccount {
  return {
    id: row.id,
    plaidItemId: row.plaid_item_id,
    plaidAccountId: row.plaid_account_id,
    name: row.name,
    officialName: row.official_name,
    type: row.type,
    subtype: row.subtype,
    currentBalance: row.current_balance,
    availableBalance: row.available_balance,
  };
}

export function listAccounts(): PlaidAccount[] {
  const rows = db.prepare("SELECT * FROM accounts").all() as AccountRow[];
  return rows.map(rowToAccount);
}

export function upsertAccount(input: {
  plaidItemDbId: number;
  plaidAccountId: string;
  name: string | null;
  officialName: string | null;
  type: string | null;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
}): void {
  db.prepare(
    `INSERT INTO accounts (plaid_item_id, plaid_account_id, name, official_name, type, subtype, current_balance, available_balance)
     VALUES (@plaidItemDbId, @plaidAccountId, @name, @officialName, @type, @subtype, @currentBalance, @availableBalance)
     ON CONFLICT(plaid_account_id) DO UPDATE SET
       name = excluded.name,
       official_name = excluded.official_name,
       type = excluded.type,
       subtype = excluded.subtype,
       current_balance = excluded.current_balance,
       available_balance = excluded.available_balance,
       updated_at = datetime('now')`
  ).run(input);
}
