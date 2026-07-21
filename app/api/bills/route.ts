import { NextResponse } from "next/server";
import { createBill, listBills } from "@/lib/repositories/billsRepo";

export async function GET() {
  return NextResponse.json(listBills());
}

export async function POST(request: Request) {
  const body = await request.json();
  const bill = createBill({
    name: body.name,
    amount: Number(body.amount),
    dueDay: body.dueDay === null || body.dueDay === undefined ? null : Number(body.dueDay),
  });
  return NextResponse.json(bill, { status: 201 });
}
