import { describe, expect, it } from "vitest";
import { simulateDebtPayoff, simulateDebtPayoffAvalanche } from "./debtPayoff";

describe("simulateDebtPayoffAvalanche", () => {
  it("pays off the higher-APR card first even when its balance is smaller", () => {
    const cards = [
      { id: 1, name: "Lower APR, bigger balance", balance: 1000, apr: 10 },
      { id: 2, name: "Higher APR, smaller balance", balance: 500, apr: 30 },
    ];

    const result = simulateDebtPayoffAvalanche(cards, 200, {
      startDate: new Date(2026, 0, 1),
    });

    const firstZeroMonth = (cardId: number) =>
      result.months.findIndex((m) => m.balances[cardId] === 0);

    const payoffB = firstZeroMonth(2);
    const payoffA = firstZeroMonth(1);

    expect(payoffB).toBeGreaterThanOrEqual(0);
    expect(payoffA).toBeGreaterThanOrEqual(0);
    expect(payoffB).toBeLessThan(payoffA);
  });

  it("reflects this app's real seeded cards: Chase (26.49% APR) clears before Navy Federal (16.49% APR)", () => {
    const cards = [
      { id: 1, name: "Navy Federal CC", balance: 14404.18, apr: 16.49 },
      { id: 2, name: "Chase CC", balance: 12799.28, apr: 26.49 },
      { id: 3, name: "Bank of America CC", balance: 2232.77, apr: 0 },
    ];

    const result = simulateDebtPayoffAvalanche(cards, 1469, {
      startDate: new Date(2026, 6, 1),
    });

    const firstZeroMonth = (cardId: number) =>
      result.months.findIndex((m) => m.balances[cardId] === 0);

    expect(firstZeroMonth(2)).toBeLessThan(firstZeroMonth(1));
    expect(result.totalInterestPaid).toBeGreaterThan(0);
  });

  it("produces a monotonically non-increasing total balance", () => {
    const cards = [{ id: 1, name: "Card", balance: 2000, apr: 20 }];
    const result = simulateDebtPayoffAvalanche(cards, 100);
    for (let i = 1; i < result.months.length; i++) {
      expect(result.months[i].totalBalance).toBeLessThanOrEqual(result.months[i - 1].totalBalance);
    }
  });

  it("marks debt-free date once all balances hit zero", () => {
    const cards = [{ id: 1, name: "Small", balance: 100, apr: 15 }];
    const result = simulateDebtPayoffAvalanche(cards, 100);
    expect(result.debtFreeDate).not.toBeNull();
    expect(result.months[result.months.length - 1].totalBalance).toBe(0);
  });
});

describe("simulateDebtPayoff snowball strategy", () => {
  it("pays off the smaller balance first, even at a lower APR", () => {
    const cards = [
      { id: 1, name: "Higher APR, bigger balance", balance: 1000, apr: 30 },
      { id: 2, name: "Lower APR, smaller balance", balance: 500, apr: 10 },
    ];

    const result = simulateDebtPayoff(cards, 200, {
      strategy: "snowball",
      startDate: new Date(2026, 0, 1),
    });

    const firstZeroMonth = (cardId: number) =>
      result.months.findIndex((m) => m.balances[cardId] === 0);

    expect(firstZeroMonth(2)).toBeLessThan(firstZeroMonth(1));
  });

  it("defaults to avalanche behavior when no strategy is given", () => {
    const cards = [
      { id: 1, name: "Lower APR, bigger balance", balance: 1000, apr: 10 },
      { id: 2, name: "Higher APR, smaller balance", balance: 500, apr: 30 },
    ];
    const result = simulateDebtPayoff(cards, 200, { startDate: new Date(2026, 0, 1) });
    const firstZeroMonth = (cardId: number) =>
      result.months.findIndex((m) => m.balances[cardId] === 0);
    expect(firstZeroMonth(2)).toBeLessThan(firstZeroMonth(1));
  });
});
