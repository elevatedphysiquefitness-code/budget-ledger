import clsx from "clsx";

const colorClasses = {
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
  accent: "bg-accent",
} as const;

export default function ProgressBar({
  ratio,
  color = "accent",
  className,
}: {
  /** 0..1+; values above 1 render a full bar (caller decides how to flag overflow). */
  ratio: number;
  color?: keyof typeof colorClasses;
  className?: string;
}) {
  const widthPct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className={clsx("h-2 w-full rounded-full bg-surface-raised overflow-hidden", className)}>
      <div
        className={clsx("h-full rounded-full transition-all", colorClasses[color])}
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}
