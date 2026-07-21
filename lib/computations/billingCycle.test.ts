import { describe, expect, it } from "vitest";
import { currentCycleKey, reconcileBillCycles, resolveBillPaidState } from "./billingCycle";
import type { Bill } from "@/types/domain";

describe("currentCycleKey", () => {
  it("stays in the current month before the due day has passed", () => {
    expect(currentCycleKey(18, new Date(2026, 6, 10))).toBe("2026-07");
  });

  it("stays in the current month on the due day itself", () => {
    expect(currentCycleKey(18, new Date(2026, 6, 18))).toBe("2026-07");
  });

  it("rolls to next month the day after the due day passes", () => {
    expect(currentCycleKey(18, new Date(2026, 6, 19))).toBe("2026-08");
  });
});

const baseBill: Bill = {
  id: 1,
  name: "Chase CC",
  amount: 472,
  dueDay: 9,
  paid: true,
  paidCycleKey: "2026-07",
};

describe("resolveBillPaidState", () => {
  it("keeps paid=true while still within the cycle it was marked paid for", () => {
    const resolved = resolveBillPaidState(baseBill, new Date(2026, 6, 5));
    expect(resolved.paid).toBe(true);
  });

  it("resets paid=false the day after the due date passes", () => {
    const resolved = resolveBillPaidState(baseBill, new Date(2026, 6, 10));
    expect(resolved.paid).toBe(false);
    expect(resolved.paidCycleKey).toBeNull();
  });

  it("leaves unpaid bills untouched", () => {
    const unpaid: Bill = { ...baseBill, paid: false, paidCycleKey: null };
    const resolved = resolveBillPaidState(unpaid, new Date(2026, 7, 10));
    expect(resolved).toEqual(unpaid);
  });

  it("never auto-resets a bill with no due day", () => {
    const noDueDay: Bill = { ...baseBill, dueDay: null };
    const resolved = resolveBillPaidState(noDueDay, new Date(2027, 0, 1));
    expect(resolved.paid).toBe(true);
  });
});

describe("reconcileBillCycles", () => {
  it("only returns bills whose paid state actually changed", () => {
    const stillPaid: Bill = { ...baseBill, id: 1 };
    const nowUnpaid: Bill = { ...baseBill, id: 2, paidCycleKey: "2026-06" };
    const changed = reconcileBillCycles([stillPaid, nowUnpaid], new Date(2026, 6, 5));
    expect(changed.map((b) => b.id)).toEqual([2]);
  });
});
