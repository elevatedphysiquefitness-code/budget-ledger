import { NextResponse } from "next/server";
import { getPaySchedule, updatePaySchedule } from "@/lib/repositories/incomeRepo";

export async function GET() {
  return NextResponse.json(getPaySchedule());
}

export async function PUT(request: Request) {
  const body = await request.json();
  const schedule = updatePaySchedule({
    hourlyRate: body.hourlyRate === null || body.hourlyRate === undefined ? null : Number(body.hourlyRate),
    payFrequency: body.payFrequency,
    netPerPaycheck: Number(body.netPerPaycheck),
    monthlyAverageNet:
      body.monthlyAverageNet === null || body.monthlyAverageNet === undefined
        ? null
        : Number(body.monthlyAverageNet),
    federalWithholding: body.federalWithholding,
    nextPayDate: body.nextPayDate,
    payIntervalDays: Number(body.payIntervalDays),
  });
  return NextResponse.json(schedule);
}
