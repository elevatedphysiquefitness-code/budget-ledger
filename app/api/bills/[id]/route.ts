import { NextResponse } from "next/server";
import { deleteBill, updateBill } from "@/lib/repositories/billsRepo";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const bill = updateBill(Number(id), {
    name: body.name,
    amount: body.amount !== undefined ? Number(body.amount) : undefined,
    dueDay:
      body.dueDay === undefined
        ? undefined
        : body.dueDay === null
          ? null
          : Number(body.dueDay),
  });
  if (!bill) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(bill);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteBill(Number(id));
  return new NextResponse(null, { status: 204 });
}
