import { NextResponse } from "next/server";
import { hasPinConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ configured: hasPinConfigured() });
}
