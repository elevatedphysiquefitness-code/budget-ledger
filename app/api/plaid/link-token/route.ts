import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { extractPlaidErrorMessage, getPlaidClient, isPlaidConfigured } from "@/lib/plaid";

const NOT_CONFIGURED = {
  error: "not_connected",
  message: "Bank not connected — add your Plaid keys in Settings to enable.",
};

export async function POST() {
  if (!isPlaidConfigured()) {
    return NextResponse.json(NOT_CONFIGURED, { status: 503 });
  }

  try {
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
  } catch (error) {
    return NextResponse.json(
      { error: "plaid_error", message: extractPlaidErrorMessage(error) },
      { status: 502 }
    );
  }
}
