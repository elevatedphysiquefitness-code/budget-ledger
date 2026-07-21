import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getCredentials, type PlaidCredentials } from "@/lib/repositories/plaidCredentialsRepo";

export class PlaidNotConfiguredError extends Error {
  constructor() {
    super("Plaid is not configured. Add your Plaid keys in Settings, or set PLAID_CLIENT_ID/PLAID_SECRET/PLAID_ENV in .env.local.");
    this.name = "PlaidNotConfiguredError";
  }
}

/** Stored credentials (entered via Settings) take priority; falls back to
 *  .env.local so the plain web/dev flow keeps working unchanged. */
function resolveCredentials(): PlaidCredentials | null {
  const stored = getCredentials();
  if (stored) return stored;

  if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET && process.env.PLAID_ENV) {
    return {
      clientId: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      env: process.env.PLAID_ENV,
    };
  }

  return null;
}

export function isPlaidConfigured(): boolean {
  return resolveCredentials() !== null;
}

/** No caching — credentials can change at runtime via the Settings form, and
 *  constructing a PlaidApi client is cheap (just wraps axios config). */
/** Plaid's API returns a structured error body — surface that instead of a
 *  raw axios exception (which otherwise crashes the route with no useful
 *  message, easy to hit now that credentials are hand-typed in Settings
 *  rather than carefully placed in an env file). */
export function extractPlaidErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error_message?: unknown } } }).response;
    const message = response?.data?.error_message;
    if (typeof message === "string" && message) return message;
  }
  return "Plaid rejected the request — double-check your Client ID, Secret, and Environment in Settings.";
}

export function getPlaidClient(): PlaidApi {
  const credentials = resolveCredentials();
  if (!credentials) throw new PlaidNotConfiguredError();

  const env = credentials.env as keyof typeof PlaidEnvironments;
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": credentials.clientId,
        "PLAID-SECRET": credentials.secret,
      },
    },
  });
  return new PlaidApi(configuration);
}
