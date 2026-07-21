# Budget Ledger

A personal budgeting web app: bills, credit cards, transactions, pay schedule, a "where it goes"
allocator, debt payoff and savings growth projections, and a day-by-day cash-flow forecast. SQLite
for local persistence, optional read-only Plaid bank sync.

## Setup

This is a template — clone it and run your own private instance with your own data. Nobody else
sees your numbers; there's no shared server or account system.

```bash
npm install
cp budget-data-export.example.json budget-data-export.json   # then edit in your own numbers
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database lives at `data/budget-ledger.db`
and is seeded automatically from `budget-data-export.json` the first time it's created.
`budget-data-export.json` is gitignored — it's meant to stay local, never committed.

## Connecting a bank account (optional)

The app works fully on manual/seeded data with no setup. To link a real bank account in Plaid's
sandbox:

1. Sign up free at [dashboard.plaid.com](https://dashboard.plaid.com) and grab your sandbox
   `client_id` and `secret`.
2. Copy `.env.local.example` to `.env.local` and fill in `PLAID_CLIENT_ID`, `PLAID_SECRET`,
   `PLAID_ENV=sandbox`.
3. Generate an encryption key for the stored access token: `npm run gen-key`, and add the printed
   value as `ENCRYPTION_KEY` in `.env.local`.
4. Restart the dev server, go to Settings, and connect.

Bank access is read-only (transactions only) — there is no code path in this app that can move
money or make payments. See the Settings page for the full security notes on token storage.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and serve
- `npm run test` — run the computation-module unit tests (vitest)
- `npm run seed -- --force` — wipe and reseed the database from `budget-data-export.json`
- `npm run gen-key` — print a new `ENCRYPTION_KEY`
- `npm run dist:mac` / `npm run dist:win` — build a double-click desktop installer (see below)

## Building a desktop app to share with someone non-technical

`npm run dist:mac` and `npm run dist:win` package the whole app (server + SQLite + UI) into a
standalone Electron desktop app — a `.dmg` for Mac or a `.exe` installer for Windows — that starts
empty (no seed data) so the recipient fills in their own bills, cards, and pay schedule using the
app's own screens. No terminal, no Node.js install, no GitHub account needed on their end.

Installers land in `dist-electron/`. They're unsigned (no paid developer account needed), so the
recipient will see a one-time "unknown developer" warning on first launch — send them
`electron/RECIPIENT_README.md` alongside the installer, it walks through exactly what to click.

Notes if you rebuild these yourself:
- `better-sqlite3` is a native module; the build script rebuilds it for Electron's exact ABI
  before packaging, and restores it back to a normal Node build afterward so `npm run dev` keeps
  working. If `npm run dev` ever breaks after a `dist:*` build, run `npm rebuild better-sqlite3`.
- The Windows build is cross-built from macOS. It's been verified to package a correct x64 binary,
  but hasn't been run on an actual Windows machine — worth a smoke test before wide distribution.

## Stack

Next.js (App Router, TypeScript) with API routes as the backend, `better-sqlite3` for storage,
Tailwind CSS for the dark ledger-style UI, `recharts` for charts, and the `plaid` /
`react-plaid-link` SDKs for the optional bank connection.
