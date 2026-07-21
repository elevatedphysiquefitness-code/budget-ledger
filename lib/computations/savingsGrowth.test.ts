import { describe, expect, it } from "vitest";
import { projectSavingsGrowth } from "./savingsGrowth";

describe("projectSavingsGrowth", () => {
  it("produces 60 monthly points and milestones matching those points", () => {
    const result = projectSavingsGrowth(1000, 125, 4, new Date(2026, 0, 1));
    expect(result.points).toHaveLength(60);
    expect(result.milestones.sixMonth).toBe(result.points[5].balance);
    expect(result.milestones.oneYear).toBe(result.points[11].balance);
    expect(result.milestones.threeYear).toBe(result.points[35].balance);
    expect(result.milestones.fiveYear).toBe(result.points[59].balance);
  });

  it("grows balance every month with a positive contribution and APY", () => {
    const result = projectSavingsGrowth(1000, 125, 4, new Date(2026, 0, 1));
    for (let i = 1; i < result.points.length; i++) {
      expect(result.points[i].balance).toBeGreaterThan(result.points[i - 1].balance);
    }
  });

  it("with zero contribution and zero APY, balance never changes", () => {
    const result = projectSavingsGrowth(500, 0, 0, new Date(2026, 0, 1));
    expect(result.milestones.fiveYear).toBe(500);
  });
});
