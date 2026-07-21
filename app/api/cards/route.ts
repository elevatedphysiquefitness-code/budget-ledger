import { NextResponse } from "next/server";
import { createCard, listCards } from "@/lib/repositories/cardsRepo";

export async function GET() {
  return NextResponse.json(listCards());
}

export async function POST(request: Request) {
  const body = await request.json();
  const card = createCard({
    name: body.name,
    balance: Number(body.balance),
    creditLimit: Number(body.creditLimit),
    apr: Number(body.apr),
  });
  return NextResponse.json(card, { status: 201 });
}
