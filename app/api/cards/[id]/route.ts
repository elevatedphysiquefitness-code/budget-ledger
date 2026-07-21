import { NextResponse } from "next/server";
import { deleteCard, updateCard } from "@/lib/repositories/cardsRepo";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const card = updateCard(Number(id), {
    name: body.name,
    balance: body.balance !== undefined ? Number(body.balance) : undefined,
    creditLimit: body.creditLimit !== undefined ? Number(body.creditLimit) : undefined,
    apr: body.apr !== undefined ? Number(body.apr) : undefined,
  });
  if (!card) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteCard(Number(id));
  return new NextResponse(null, { status: 204 });
}
