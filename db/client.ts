import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seed";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "budget-ledger.db");

function createDb(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(
    path.join(process.cwd(), "db", "schema.sql"),
    "utf-8"
  );
  database.exec(schema);
  seedIfEmpty(database);
  return database;
}

declare global {
  // eslint-disable-next-line no-var
  var __budgetLedgerDb: Database.Database | undefined;
}

// Cache the connection on the global object so Next.js dev-mode module
// reloading doesn't open a new handle to the same file on every request.
export const db: Database.Database = globalThis.__budgetLedgerDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__budgetLedgerDb = db;
}
