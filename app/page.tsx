import PageHeader from "@/components/layout/PageHeader";
import LedgerAmount from "@/components/ledger/LedgerAmount";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Budget Ledger" subtitle="Today" />
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-muted mb-1">Current balance</p>
        <LedgerAmount value={0} className="text-3xl" />
      </div>
    </div>
  );
}
