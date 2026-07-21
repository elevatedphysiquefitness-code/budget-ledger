import { NextResponse } from "next/server";
import { EncryptionKeyMissingError } from "@/lib/crypto";
import { clearCredentials, saveCredentials } from "@/lib/repositories/plaidCredentialsRepo";

export async function POST(request: Request) {
  const body = await request.json();
  const clientId = String(body.clientId ?? "").trim();
  const secret = String(body.secret ?? "").trim();
  const env = String(body.env ?? "sandbox").trim();

  if (!clientId || !secret) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    saveCredentials({ clientId, secret, env });
  } catch (error) {
    if (error instanceof EncryptionKeyMissingError) {
      return NextResponse.json({ error: "encryption_key_missing", message: error.message }, { status: 500 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearCredentials();
  return NextResponse.json({ ok: true });
}
