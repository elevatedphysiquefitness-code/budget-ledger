import { NextResponse } from "next/server";
import { createManualTransaction, listTransactionsWithRunningBalance } from "@/lib/repositories/transactionsRepo";

export async function GET() {
  return NextResponse.json(listTransactionsWithRunningBalance());
}

export async function POST(request: Request) {
  const body = await request.json();
  const transaction = createManualTransaction({
    date: body.date,
    description: body.description,
    amount: Number(body.amount),
  });
  return NextResponse.json(transaction, { status: 201 });
}
