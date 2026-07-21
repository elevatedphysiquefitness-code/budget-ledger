import { describe, expect, it } from "vitest";
import { computeAllocation } from "./allocator";

const targets = { savings: 125, food: 425, hobbies: 125, other: 125, extraTowardDebt: 1469, savingsApy: 4 };

describe("computeAllocation", () => {
  it("matches the seeded budget: leftover exactly covers targets", () => {
    const result = computeAllocation(3841.76, [{ amount: 1102.58 }], targets);
    expect(result.unpaidBillsTotal).toBeCloseTo(1102.58);
    expect(result.leftover).toBeCloseTo(2739.18);
    expect(result.targetsTotal).toBeCloseTo(2269);
    expect(result.overAllocated).toBe(false);
  });

  it("flags over-allocation when targets exceed leftover", () => {
    const result = computeAllocation(1000, [{ amount: 500 }], targets);
    expect(result.leftover).toBe(500);
    expect(result.overAllocated).toBe(true);
    expect(result.remainderAfterTargets).toBeLessThan(0);
  });
});
