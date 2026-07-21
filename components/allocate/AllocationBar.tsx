import type { AllocationTargets } from "@/types/domain";

const segments: { key: keyof Omit<AllocationTargets, "savingsApy">; label: string; className: string }[] = [
  { key: "savings", label: "Savings", className: "bg-green" },
  { key: "food", label: "Food", className: "bg-accent" },
  { key: "hobbies", label: "Hobbies", className: "bg-amber" },
  { key: "other", label: "Other", className: "bg-muted" },
  { key: "extraTowardDebt", label: "Extra to debt", className: "bg-red" },
];

export default function AllocationBar({ targets, total }: { targets: AllocationTargets; total: number }) {
  return (
    <div>
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-raised">
        {segments.map((seg) => {
          const value = targets[seg.key];
          const widthPct = total > 0 ? (value / total) * 100 : 0;
          return <div key={seg.key} className={seg.className} style={{ width: `${widthPct}%` }} />;
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-sm">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${seg.className}`} />
            <span className="text-muted">{seg.label}</span>
            <span className="font-mono ml-auto">${targets[seg.key].toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
