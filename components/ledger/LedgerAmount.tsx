import clsx from "clsx";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function LedgerAmount({
  value,
  variant = "plain",
  className,
}: {
  value: number;
  /** "plain" always shows the magnitude in the default color. "signed" colors
   *  inflows green and outflows red, with an explicit +/- prefix. */
  variant?: "plain" | "signed";
  className?: string;
}) {
  if (variant === "signed") {
    const isPositive = value >= 0;
    return (
      <span
        className={clsx(
          "font-mono tabular-nums",
          isPositive ? "text-green" : "text-red",
          className
        )}
      >
        {isPositive ? "+" : "-"}
        {currency.format(Math.abs(value))}
      </span>
    );
  }

  return (
    <span className={clsx("font-mono tabular-nums", className)}>
      {currency.format(Math.abs(value))}
    </span>
  );
}
