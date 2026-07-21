import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

const links = [
  { href: "/income", label: "Pay schedule", description: "Paydays, amount, frequency" },
  { href: "/allocate", label: "Where it goes", description: "Split your leftover income" },
  { href: "/projections", label: "Projections", description: "Debt payoff & savings growth" },
  { href: "/forecast", label: "Cash-flow forecast", description: "30/60/90-day balance outlook" },
  { href: "/settings", label: "Settings", description: "Bank connection, APY, security" },
];

export default function MorePage() {
  return (
    <div>
      <PageHeader title="More" />
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-4 py-4 hover:bg-surface-raised transition-colors"
          >
            <div>
              <p className="font-medium">{link.label}</p>
              <p className="text-sm text-muted">{link.description}</p>
            </div>
            <span className="text-muted">&rsaquo;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
