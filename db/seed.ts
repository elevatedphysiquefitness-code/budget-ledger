import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import { currentCycleKey } from "@/lib/computations/billingCycle";

interface SeedBill {
  name: string;
  amount: number;
  day: number | null;
  paid: boolean;
}

interface SeedCard {
  name: string;
  balance: number;
  limit: number;
  apr: number;
}

interface SeedAllocation {
  savings: number;
  food: number;
  hobbies: number;
  other: number;
  extraTowardDebt: number;
  savingsApy: number;
}

interface SeedIncome {
  hourlyRate: number;
  payFrequency: string;
  netPerFullPaycheck: number;
  monthlyAverageNet: number;
  federalWithholding: string;
  nextPayDate: string;
  payIntervalDays: number;
}

interface SeedTransaction {
  date: string;
  desc: string;
  amount: number;
}

interface SeedExport {
  bills: SeedBill[];
  cards: SeedCard[];
  allocation: SeedAllocation;
  income: SeedIncome;
  startingBalance: number;
  transactions: SeedTransaction[];
  currentAccountBalance: number;
}

function readSeedFile(): SeedExport {
  const seedPath = path.join(process.cwd(), "budget-data-export.json");
  if (!fs.existsSync(seedPath)) {
    throw new Error(
      `Seed file not found at ${seedPath}. Add budget-data-export.json to the project root before seeding — refusing to fabricate starting financial data.`
    );
  }
  return JSON.parse(fs.readFileSync(seedPath, "utf-8")) as SeedExport;
}

function insertAll(database: Database.Database, data: SeedExport): void {
  const now = new Date();

  const insertBill = database.prepare(
    `INSERT INTO bills (name, amount, due_day, paid, paid_cycle_key) VALUES (@name, @amount, @dueDay, @paid, @paidCycleKey)`
  );
  const insertCard = database.prepare(
    `INSERT INTO cards (name, balance, credit_limit, apr) VALUES (@name, @balance, @creditLimit, @apr)`
  );
  const insertAllocation = database.prepare(
    `INSERT INTO allocation_targets (id, savings, food, hobbies, other, extra_toward_debt, savings_apy)
     VALUES (1, @savings, @food, @hobbies, @other, @extraTowardDebt, @savingsApy)`
  );
  const insertPaySchedule = database.prepare(
    `INSERT INTO pay_schedule (id, hourly_rate, pay_frequency, net_per_paycheck, monthly_average_net, federal_withholding, next_pay_date, pay_interval_days)
     VALUES (1, @hourlyRate, @payFrequency, @netPerPaycheck, @monthlyAverageNet, @federalWithholding, @nextPayDate, @payIntervalDays)`
  );
  const insertSetting = database.prepare(
    `INSERT INTO settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  );
  const insertTransaction = database.prepare(
    `INSERT INTO transactions (date, description, amount, source, plaid_transaction_id, plaid_account_id, category, pending)
     VALUES (@date, @description, @amount, 'manual', NULL, NULL, NULL, 0)`
  );
  const insertMeta = database.prepare(
    `INSERT INTO meta (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );

  const run = database.transaction(() => {
    for (const bill of data.bills) {
      insertBill.run({
        name: bill.name,
        amount: bill.amount,
        dueDay: bill.day,
        paid: bill.paid ? 1 : 0,
        paidCycleKey:
          bill.paid && bill.day !== null ? currentCycleKey(bill.day, now) : null,
      });
    }

    for (const card of data.cards) {
      insertCard.run({
        name: card.name,
        balance: card.balance,
        creditLimit: card.limit,
        apr: card.apr,
      });
    }

    insertAllocation.run({
      savings: data.allocation.savings,
      food: data.allocation.food,
      hobbies: data.allocation.hobbies,
      other: data.allocation.other,
      extraTowardDebt: data.allocation.extraTowardDebt,
      savingsApy: data.allocation.savingsApy,
    });

    insertPaySchedule.run({
      hourlyRate: data.income.hourlyRate,
      payFrequency: data.income.payFrequency,
      netPerPaycheck: data.income.netPerFullPaycheck,
      monthlyAverageNet: data.income.monthlyAverageNet,
      federalWithholding: data.income.federalWithholding,
      nextPayDate: data.income.nextPayDate,
      payIntervalDays: data.income.payIntervalDays,
    });

    insertSetting.run({ key: "starting_balance", value: String(data.startingBalance) });
    insertSetting.run({
      key: "current_account_balance_manual_override",
      value: String(data.currentAccountBalance),
    });
    insertSetting.run({ key: "debt_payoff_extra_payment", value: "0" });

    for (const txn of data.transactions) {
      insertTransaction.run({
        date: txn.date,
        description: txn.desc,
        amount: txn.amount,
      });
    }

    insertMeta.run({ key: "schema_version", value: "1" });
    insertMeta.run({ key: "seed_imported_at", value: now.toISOString() });
  });

  run();
}

function isEmpty(database: Database.Database): boolean {
  const row = database.prepare("SELECT COUNT(*) AS count FROM bills").get() as {
    count: number;
  };
  return row.count === 0;
}

export function seedIfEmpty(database: Database.Database): void {
  if (!isEmpty(database)) return;
  const seedPath = path.join(process.cwd(), "budget-data-export.json");
  if (!fs.existsSync(seedPath)) return; // fresh install with no seed file: start empty, don't crash
  const data = readSeedFile();
  insertAll(database, data);
}

export function seedForce(database: Database.Database): void {
  const wipe = database.transaction(() => {
    database.exec(`
      DELETE FROM transactions;
      DELETE FROM bills;
      DELETE FROM cards;
      DELETE FROM allocation_targets;
      DELETE FROM pay_schedule;
      DELETE FROM settings;
      DELETE FROM meta;
    `);
  });
  wipe();
  const data = readSeedFile();
  insertAll(database, data);
}
