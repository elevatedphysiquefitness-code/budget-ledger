#!/usr/bin/env node
// Usage: node scripts/build-electron.mjs --mac   (or --win)
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneDir = path.join(root, ".next", "standalone");
const seedFilePath = path.join(root, "budget-data-export.json");
const realDataDir = path.join(root, "data");
const sqliteNativeBinary = path.join(
  standaloneDir,
  "node_modules",
  "better-sqlite3",
  "build",
  "Release",
  "better_sqlite3.node"
);

const target = process.argv.includes("--win") ? "win" : "mac";
const rebuildPlatformFlags = target === "win" ? "--platform win32 --arch x64" : "";
// Most Windows PCs are x64; without forcing this, electron-builder defaults
// to the *host* architecture, which on this Apple Silicon Mac would silently
// produce a Windows ARM64 installer that won't run on typical Windows PCs
// (and would mismatch the x64-rebuilt better-sqlite3 binary above).
const electronBuilderFlag = target === "win" ? "--win --x64" : "--mac";

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

function copyInto(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`copied ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

console.log(`Building for target: ${target}`);

// --- Build-time safety: db/client.ts opens the SQLite file at module-load
// time, which Next's page-data collection can trigger for real during
// `next build` — and pointing DATA_DIR at a scratch directory alone turned
// out not to be enough (Turbopack appears to run some build-time work in a
// process/worker that doesn't pick up the per-invocation env override, which
// once produced a *real* data/ directory, with real rows, inside the
// standalone output despite DATA_DIR being set). So in addition to that env
// override, physically move both the real data/ directory and the seed JSON
// out of the project for the build's duration — if they don't exist on disk
// at all, nothing can leak them, regardless of which process touches them.
const seedBackupPath = path.join(os.tmpdir(), `budget-data-export.buildbak.${Date.now()}.json`);
const dataBackupPath = path.join(os.tmpdir(), `budget-ledger-data-buildbak-${Date.now()}`);
const scratchDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "budget-ledger-build-data-"));
const seedWasPresent = fs.existsSync(seedFilePath);
const realDataWasPresent = fs.existsSync(realDataDir);

try {
  // Next's file tracer only copies the .node binary + JS that better-sqlite3
  // actually touches at runtime — it drops binding.gyp/src/deps, so
  // electron-rebuild can't detect or rebuild the copy *inside* the standalone
  // output afterward ("No native modules found"). Rebuilding the ROOT copy
  // first means `next build` copies an already-correct Electron-ABI binary.
  console.log(`\n=== 1/6: rebuild better-sqlite3 for Electron's ABI (${target}), root copy ===`);
  run(
    `npx electron-rebuild --module-dir "${root}" --force --only better-sqlite3 ${rebuildPlatformFlags}`.trim()
  );

  if (seedWasPresent) {
    fs.renameSync(seedFilePath, seedBackupPath);
    console.log(`(build safety) moved budget-data-export.json out of the project for the build`);
  }
  if (realDataWasPresent) {
    fs.renameSync(realDataDir, dataBackupPath);
    console.log(`(build safety) moved data/ out of the project for the build`);
  }

  console.log("\n=== 2/6: next build (standalone output) ===");
  try {
    run("npx next build", { env: { ...process.env, DATA_DIR: scratchDataDir } });
  } finally {
    if (seedWasPresent) {
      fs.renameSync(seedBackupPath, seedFilePath);
      console.log("(build safety) restored budget-data-export.json");
    }
    if (realDataWasPresent) {
      fs.rmSync(realDataDir, { recursive: true, force: true }); // remove any stray dir the build created
      fs.renameSync(dataBackupPath, realDataDir);
      console.log("(build safety) restored data/");
    }
    fs.rmSync(scratchDataDir, { recursive: true, force: true });
  }

  // Belt-and-suspenders: fail loudly if personal data somehow still ended up
  // in the standalone output, instead of silently shipping it.
  for (const suspect of ["data", "budget-data-export.json"]) {
    const p = path.join(standaloneDir, suspect);
    if (fs.existsSync(p)) {
      throw new Error(
        `Refusing to continue: ${p} exists in the standalone build output. This would ship personal data in the installer.`
      );
    }
  }

  console.log("\n=== 3/6: copy static assets + schema into the standalone bundle ===");
  copyInto(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
  copyInto(path.join(root, "public"), path.join(standaloneDir, "public"));
  fs.mkdirSync(path.join(standaloneDir, "db"), { recursive: true });
  fs.copyFileSync(path.join(root, "db", "schema.sql"), path.join(standaloneDir, "db", "schema.sql"));
  console.log("copied db/schema.sql -> .next/standalone/db/schema.sql");

  // Verify the shipped binary actually loads under Electron's own Node
  // runtime — this exact mismatch (NODE_MODULE_VERSION) is what silently
  // broke every DB-touching route in an earlier build of this pipeline, and
  // `electron-rebuild` reporting success is not sufficient proof it worked.
  console.log("\n=== 4/6: verify the shipped native binary loads under Electron's Node ===");
  if (!fs.existsSync(sqliteNativeBinary)) {
    throw new Error(`Expected native binary not found at ${sqliteNativeBinary}`);
  }
  if (target === "mac") {
    const electronBin = path.join(root, "node_modules", ".bin", "electron");
    try {
      run(`"${electronBin}" -e "require('better-sqlite3'); console.log('OK: loaded under Electron')"`, {
        cwd: standaloneDir,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      });
    } catch {
      throw new Error(
        "better-sqlite3 failed to load under Electron's Node runtime — the shipped binary doesn't match Electron's ABI."
      );
    }
  } else {
    console.log("(skipped: cross-built for Windows, can't execute the binary on this Mac)");
  }

  console.log("\n=== 5/6: compile Electron main process ===");
  run("npx tsc -p electron/tsconfig.json");

  console.log(`\n=== 6/6: package installer with electron-builder (${electronBuilderFlag}) ===`);
  run(`npx electron-builder ${electronBuilderFlag}`);

  console.log("\nDone. See dist-electron/ for installers.");
} finally {
  // Always leave the dev environment in its normal state: better-sqlite3
  // rebuilt for Electron's ABI is *not* usable by `npm run dev`/`npm test`
  // (system Node). Restore it for system Node no matter how the build went.
  console.log("\n(cleanup) restoring better-sqlite3 for system Node...");
  try {
    run("npm rebuild better-sqlite3");
  } catch (error) {
    console.error(
      "WARNING: failed to restore better-sqlite3 for system Node. Run `npm rebuild better-sqlite3` manually before using `npm run dev`."
    );
    console.error(error);
  }
}
