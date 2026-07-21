import { NextResponse } from "next/server";
import { deleteTransaction, updateManualTransaction } from "@/lib/repositories/transactionsRepo";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const transaction = updateManualTransaction(Number(id), {
    date: body.date,
    description: body.description,
    amount: body.amount !== undefined ? Number(body.amount) : undefined,
  });
  if (!transaction) {
    return NextResponse.json(
      { error: "not_editable", message: "Only manually-entered transactions can be edited." },
      { status: 409 }
    );
  }
  return NextResponse.json(transaction);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteTransaction(Number(id));
  return new NextResponse(null, { status: 204 });
}
