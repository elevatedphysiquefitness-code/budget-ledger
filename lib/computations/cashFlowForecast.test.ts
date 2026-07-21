import { describe, expect, it } from "vitest";
import { forecastCashFlow, type DayForecast } from "./cashFlowForecast";

const findDay = (days: DayForecast[], iso: string) => days.find((d) => d.date === iso)!;

describe("forecastCashFlow", () => {
  it("applies paydays and bill due dates on the correct days", () => {
    const result = forecastCashFlow({
      startingBalance: 500,
      asOf: new Date(2026, 0, 1),
      horizonDays: 30,
      bills: [{ name: "Rent", amount: 200, dueDay: 15, paid: false }],
      paySchedule: { nextPayDate: "2026-01-10", netPerPaycheck: 1000, payIntervalDays: 14 },
    });

    expect(findDay(result.days, "2026-01-10").projectedBalance).toBe(1500);
    expect(findDay(result.days, "2026-01-15").projectedBalance).toBe(1300);
    expect(findDay(result.days, "2026-01-24").projectedBalance).toBe(2300);
    expect(result.days[result.days.length - 1].projectedBalance).toBe(2300);
  });

  it("flags a negative-balance day and records the first occurrence", () => {
    const result = forecastCashFlow({
      startingBalance: 50,
      asOf: new Date(2026, 0, 1),
      horizonDays: 10,
      bills: [{ name: "Car Note", amount: 100, dueDay: 5, paid: false }],
      paySchedule: { nextPayDate: "2027-01-01", netPerPaycheck: 1000, payIntervalDays: 14 },
    });

    expect(result.firstNegativeDate).toBe("2026-01-05");
    expect(findDay(result.days, "2026-01-05").warning).toBe("negative");
    expect(findDay(result.days, "2026-01-06").warning).toBe("negative");
  });

  it("flags a low (sub-$100) but non-negative balance day", () => {
    const result = forecastCashFlow({
      startingBalance: 150,
      asOf: new Date(2026, 0, 1),
      horizonDays: 10,
      bills: [{ name: "Utilities", amount: 60, dueDay: 5, paid: false }],
      paySchedule: { nextPayDate: "2027-01-01", netPerPaycheck: 1000, payIntervalDays: 14 },
    });

    expect(result.firstNegativeDate).toBeNull();
    expect(result.firstLowBalanceDate).toBe("2026-01-05");
    expect(findDay(result.days, "2026-01-05").warning).toBe("low");
  });

  it("skips the first occurrence of a bill already paid this cycle, but charges the next one", () => {
    const result = forecastCashFlow({
      startingBalance: 1000,
      asOf: new Date(2026, 0, 1),
      horizonDays: 40,
      bills: [{ name: "Chase CC", amount: 100, dueDay: 5, paid: true }],
      paySchedule: { nextPayDate: "2027-01-01", netPerPaycheck: 1000, payIntervalDays: 14 },
    });

    expect(findDay(result.days, "2026-01-05").projectedBalance).toBe(1000);
    expect(findDay(result.days, "2026-01-05").events).toHaveLength(0);
    expect(findDay(result.days, "2026-02-05").projectedBalance).toBe(900);
  });

  it("steps a past nextPayDate forward to find paydays within the horizon", () => {
    const result = forecastCashFlow({
      startingBalance: 0,
      asOf: new Date(2026, 6, 20),
      horizonDays: 14,
      bills: [],
      paySchedule: { nextPayDate: "2026-07-17", netPerPaycheck: 500, payIntervalDays: 14 },
    });

    // 07-17 + 14 = 07-31, the next payday on/after asOf (07-20)
    expect(findDay(result.days, "2026-07-31").projectedBalance).toBe(500);
  });
});
