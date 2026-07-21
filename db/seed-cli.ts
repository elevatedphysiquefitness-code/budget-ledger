import { db } from "./client";
import { seedForce } from "./seed";

const force = process.argv.includes("--force");

if (!force) {
  console.log(
    "Database already seeds automatically on first boot. Nothing to do — pass --force to wipe and reseed from budget-data-export.json."
  );
  process.exit(0);
}

seedForce(db);
console.log("Reseeded database from budget-data-export.json.");
