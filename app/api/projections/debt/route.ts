import { NextResponse } from "next/server";
import { listCards } from "@/lib/repositories/cardsRepo";
import { simulateDebtPayoffAvalanche } from "@/lib/computations/debtPayoff";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const extraPayment = Number(searchParams.get("extraPayment") ?? "0");

  const cards = listCards();
  const result = simulateDebtPayoffAvalanche(
    cards.map((c) => ({ id: c.id, name: c.name, balance: c.balance, apr: c.apr })),
    extraPayment
  );
  return NextResponse.json(result);
}
