import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { getPlaidClient, isPlaidConfigured } from "@/lib/plaid";

const NOT_CONFIGURED = {
  error: "not_connected",
  message: "Bank not connected — add Plaid sandbox keys to .env.local to enable.",
};

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 });
  }

  const client = getPlaidClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: "budget-ledger-single-user" },
    client_name: "Budget Ledger",
    // Read-only: transactions only, no auth/payment_initiation products.
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return NextResponse.json({ linkToken: response.data.link_token });
}
