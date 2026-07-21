import { describe, expect, it } from "vitest";
import { utilizationBucket, utilizationRatio } from "./creditUtilization";

describe("utilizationRatio", () => {
  it("computes balance/limit", () => {
    expect(utilizationRatio(3000, 10000)).toBeCloseTo(0.3);
  });

  it("guards against a non-positive limit", () => {
    expect(utilizationRatio(100, 0)).toBe(0);
    expect(utilizationRatio(100, -5)).toBe(0);
  });
});

describe("utilizationBucket", () => {
  it("is green under 30%", () => {
    expect(utilizationBucket(0.29)).toBe("green");
  });

  it("is amber from 30% up to 89%", () => {
    expect(utilizationBucket(0.3)).toBe("amber");
    expect(utilizationBucket(0.89)).toBe("amber");
  });

  it("is red at 90% and above", () => {
    expect(utilizationBucket(0.9)).toBe("red");
    expect(utilizationBucket(1.5)).toBe("red");
  });
});
