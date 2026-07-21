import { NextResponse } from "next/server";
import { getCurrentBalance } from "@/lib/repositories/balanceRepo";

export async function GET() {
  return NextResponse.json(getCurrentBalance());
}
