import { describe, expect, it } from "vitest";
import { compareDebtStrategies, computeBudgetBenchmarks, projectSavingsToTarget } from "./guidance";

describe("compareDebtStrategies", () => {
  it("runs both strategies and reports how much avalanche saves in interest", () => {
    const cards = [
      { id: 1, name: "Higher APR, bigger balance", balance: 1000, apr: 30 },
      { id: 2, name: "Lower APR, smaller balance", balance: 500, apr: 10 },
    ];
    const result = compareDebtStrategies(cards, 200, { startDate: new Date(2026, 0, 1) });

    expect(result.avalanche.totalInterestPaid).toBeLessThanOrEqual(result.snowball.totalInterestPaid);
    expect(result.interestSavedByAvalanche).toBeGreaterThanOrEqual(0);
    expect(result.interestSavedByAvalanche).toBeCloseTo(
      result.snowball.totalInterestPaid - result.avalanche.totalInterestPaid
    );
  });
});

describe("projectSavingsToTarget", () => {
  it("returns 0 months when already at or above the target", () => {
    const result = projectSavingsToTarget(1000, 100, 4, 500);
    expect(result.monthsToTarget).toBe(0);
    expect(result.onTrack).toBe(true);
  });

  it("finds the month a growing balance crosses the target", () => {
    const result = projectSavingsToTarget(0, 500, 0, 2000, new Date(2026, 0, 1));
    // 0% APY, $500/mo: crosses $2000 in month 4 (2000 exactly)
    expect(result.monthsToTarget).toBe(4);
    expect(result.onTrack).toBe(true);
    expect(result.targetDate).toBe("2026-05-01");
  });

  it("reports not on track when the target is never reached within the window", () => {
    const result = projectSavingsToTarget(0, 0, 0, 1000);
    expect(result.monthsToTarget).toBeNull();
    expect(result.onTrack).toBe(false);
    expect(result.targetDate).toBeNull();
  });
});

describe("computeBudgetBenchmarks", () => {
  const targets = { savings: 200, food: 150, hobbies: 100, other: 50, extraTowardDebt: 100, savingsApy: 4 };

  it("classifies savings+debt and food against their guideline bands", () => {
    // leftover 1000: savings+debt = 300 (30%, "high"), food = 150 (15%, "within")
    const result = computeBudgetBenchmarks(1000, targets);
    expect(result.savingsAndDebt.band).toBe("high");
    expect(result.food.band).toBe("within");
  });

  it("flags a low savings+debt rate", () => {
    const result = computeBudgetBenchmarks(3000, { ...targets, savings: 100, extraTowardDebt: 0 });
    expect(result.savingsAndDebt.percentOfLeftover).toBeCloseTo(100 / 3000);
    expect(result.savingsAndDebt.band).toBe("low");
  });

  it("leaves hobbies and other unbanded, percentage only", () => {
    const result = computeBudgetBenchmarks(1000, targets);
    expect(result.hobbies.band).toBeUndefined();
    expect(result.other.band).toBeUndefined();
    expect(result.hobbies.percentOfLeftover).toBeCloseTo(0.1);
  });

  it("guards against a non-positive leftover", () => {
    const result = computeBudgetBenchmarks(0, targets);
    expect(result.food.percentOfLeftover).toBe(0);
  });
});
