import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, clearPin, verifyPin } from "@/lib/auth";

// Gated by the current PIN as proof (not the session cookie) — same reasoning
// as set-pin/route.ts.
export async function POST(request: Request) {
  const body = await request.json();
  const currentPin = String(body.currentPin ?? "");

  if (!verifyPin(currentPin)) {
    return NextResponse.json({ error: "invalid_current_pin" }, { status: 401 });
  }

  clearPin();
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
