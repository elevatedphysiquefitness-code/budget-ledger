import { NextResponse } from "next/server";
import { toggleBillPaid } from "@/lib/repositories/billsRepo";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = toggleBillPaid(Number(id));
  if (!bill) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(bill);
}
