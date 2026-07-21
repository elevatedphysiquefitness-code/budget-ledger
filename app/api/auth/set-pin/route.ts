import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, hasPinConfigured, issueSessionToken, setPin, verifyPin } from "@/lib/auth";

// This route is intentionally reachable without a session cookie (there's no
// session yet on first setup) — changing an *existing* PIN is gated instead
// by requiring the current PIN as proof, independent of cookie state.
export async function POST(request: Request) {
  const body = await request.json();
  const newPin = String(body.newPin ?? "");

  if (newPin.length < 4) {
    return NextResponse.json({ error: "pin_too_short" }, { status: 400 });
  }

  if (hasPinConfigured()) {
    const currentPin = String(body.currentPin ?? "");
    if (!verifyPin(currentPin)) {
      return NextResponse.json({ error: "invalid_current_pin" }, { status: 401 });
    }
  }

  setPin(newPin);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, issueSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
  return response;
}
