import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seed";

const DB_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
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
  var __budgetLedgerDb: Database.Database | undefined;
}

// Lazy: the connection is only opened on first actual use, not just from
// importing this module. Next.js executes route modules during build-time
// page-data collection (across several parallel workers) purely to analyze
// them — eagerly opening/seeding a real file there caused real file I/O
// (and a multi-worker SQLITE_BUSY race) as a side effect of a build.
export function getDb(): Database.Database {
  if (!globalThis.__budgetLedgerDb) {
    globalThis.__budgetLedgerDb = createDb();
  }
  return globalThis.__budgetLedgerDb;
}
