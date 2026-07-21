export interface Bill {
  id: number;
  name: string;
  amount: number;
  dueDay: number | null;
  paid: boolean;
  paidCycleKey: string | null;
}

export interface Card {
  id: number;
  name: string;
  balance: number;
  creditLimit: number;
  apr: number;
}

export interface AllocationTargets {
  savings: number;
  food: number;
  hobbies: number;
  other: number;
  extraTowardDebt: number;
  savingsApy: number;
}

export type PayFrequency = "biweekly" | "weekly" | "monthly" | "semimonthly";
export type FederalWithholding = "exempt" | "standard";

export interface PaySchedule {
  hourlyRate: number | null;
  payFrequency: PayFrequency;
  netPerPaycheck: number;
  monthlyAverageNet: number | null;
  federalWithholding: FederalWithholding;
  nextPayDate: string;
  payIntervalDays: number;
}

export type TransactionSource = "plaid" | "manual";

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  source: TransactionSource;
  plaidTransactionId: string | null;
  plaidAccountId: string | null;
  category: string | null;
  pending: boolean;
}

export interface PlaidItem {
  id: number;
  itemId: string;
  institutionName: string | null;
  cursor: string | null;
  lastSyncedAt: string | null;
}

export interface PlaidAccount {
  id: number;
  plaidItemId: number;
  plaidAccountId: string;
  name: string | null;
  officialName: string | null;
  type: string | null;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
}
