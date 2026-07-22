import { describe, expect, it } from "vitest";
import { computeSpendingByCategory } from "./spendingByCategory";

describe("computeSpendingByCategory", () => {
  it("only counts outflows, ignoring inflows like paychecks", () => {
    const result = computeSpendingByCategory([
      { amount: 1800, category: "INCOME" },
      { amount: -50, category: "FOOD_AND_DRINK" },
    ]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].category).toBe("FOOD_AND_DRINK");
    expect(result.totalSpent).toBe(50);
  });

  it("buckets transactions with no category into Other", () => {
    const result = computeSpendingByCategory([
      { amount: -20, category: null },
      { amount: -30, category: null },
    ]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].category).toBe("OTHER");
    expect(result.categories[0].label).toBe("Other / Uncategorized");
    expect(result.categories[0].total).toBe(50);
    expect(result.categories[0].count).toBe(2);
  });

  it("formats Plaid's SNAKE_CASE categories into readable labels", () => {
    const result = computeSpendingByCategory([{ amount: -10, category: "FOOD_AND_DRINK" }]);
    expect(result.categories[0].label).toBe("Food & Drink");
  });

  it("sorts categories by total descending", () => {
    const result = computeSpendingByCategory([
      { amount: -10, category: "ENTERTAINMENT" },
      { amount: -100, category: "RENT_AND_UTILITIES" },
      { amount: -50, category: "TRANSPORTATION" },
    ]);
    expect(result.categories.map((c) => c.category)).toEqual([
      "RENT_AND_UTILITIES",
      "TRANSPORTATION",
      "ENTERTAINMENT",
    ]);
  });

  it("sums totalSpent across all categories, rounded to cents", () => {
    const result = computeSpendingByCategory([
      { amount: -10.111, category: "A" },
      { amount: -5.222, category: "B" },
    ]);
    expect(result.totalSpent).toBe(15.33);
  });
});
