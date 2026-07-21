export type UtilizationBucket = "green" | "amber" | "red";

export function utilizationRatio(balance: number, limit: number): number {
  if (limit <= 0) return 0;
  return balance / limit;
}

export function utilizationBucket(ratio: number): UtilizationBucket {
  if (ratio >= 0.9) return "red";
  if (ratio >= 0.3) return "amber";
  return "green";
}
