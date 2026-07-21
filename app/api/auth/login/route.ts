import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, issueSessionToken, verifyPin } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const pin = String(body.pin ?? "");

  if (!verifyPin(pin)) {
    return NextResponse.json({ error: "invalid_pin" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, issueSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // plain HTTP on the local network, no TLS in scope here
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
  return response;
}
