import { getDb } from "./client";
import { seedForce } from "./seed";

const force = process.argv.includes("--force");

if (!force) {
  getDb(); // creates + auto-seeds on first boot if the tables are empty
  console.log(
    "Database initialized (seeded automatically on first boot if empty). Pass --force to wipe and reseed from budget-data-export.json."
  );
  process.exit(0);
}

seedForce(getDb());
console.log("Reseeded database from budget-data-export.json.");
