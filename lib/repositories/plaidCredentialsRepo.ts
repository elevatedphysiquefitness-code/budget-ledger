import { getSetting, setSetting } from "@/lib/repositories/settingsRepo";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

export interface PlaidCredentials {
  clientId: string;
  secret: string;
  env: string;
}

export function hasCredentials(): boolean {
  return Boolean(getSetting("plaid_client_id") && getSetting("plaid_secret_encrypted"));
}

export function getCredentials(): PlaidCredentials | null {
  const clientId = getSetting("plaid_client_id");
  const ciphertext = getSetting("plaid_secret_encrypted");
  const iv = getSetting("plaid_secret_iv");
  const authTag = getSetting("plaid_secret_auth_tag");
  const env = getSetting("plaid_env");

  if (!clientId || !ciphertext || !iv || !authTag || !env) return null;

  return { clientId, secret: decryptSecret({ ciphertext, iv, authTag }), env };
}

export function saveCredentials(input: PlaidCredentials): void {
  const encrypted = encryptSecret(input.secret);
  setSetting("plaid_client_id", input.clientId);
  setSetting("plaid_secret_encrypted", encrypted.ciphertext);
  setSetting("plaid_secret_iv", encrypted.iv);
  setSetting("plaid_secret_auth_tag", encrypted.authTag);
  setSetting("plaid_env", input.env);
}

export function clearCredentials(): void {
  setSetting("plaid_client_id", "");
  setSetting("plaid_secret_encrypted", "");
  setSetting("plaid_secret_iv", "");
  setSetting("plaid_secret_auth_tag", "");
  setSetting("plaid_env", "");
}
