import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export class PlaidNotConfiguredError extends Error {
  constructor() {
    super("Plaid is not configured. Add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV to .env.local.");
    this.name = "PlaidNotConfiguredError";
  }
}

export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET && process.env.PLAID_ENV);
}

let client: PlaidApi | null = null;

/** Lazily-constructed singleton. Throws if env vars are missing — callers must
 *  check isPlaidConfigured() first and return a clean "not connected" response
 *  rather than letting this throw reach the client. */
export function getPlaidClient(): PlaidApi {
  if (!isPlaidConfigured()) throw new PlaidNotConfiguredError();
  if (client) return client;

  const env = process.env.PLAID_ENV as keyof typeof PlaidEnvironments;
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });
  client = new PlaidApi(configuration);
  return client;
}
