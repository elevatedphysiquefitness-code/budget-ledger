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

## Stack

Next.js (App Router, TypeScript) with API routes as the backend, `better-sqlite3` for storage,
Tailwind CSS for the dark ledger-style UI, `recharts` for charts, and the `plaid` /
`react-plaid-link` SDKs for the optional bank connection.
