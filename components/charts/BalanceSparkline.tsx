"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { DayForecast } from "@/lib/computations/cashFlowForecast";

export default function BalanceSparkline({ days }: { days: DayForecast[] }) {
  const data = days.map((d) => ({ date: d.date, balance: d.projectedBalance }));
  const hasWarning = days.some((d) => d.warning !== null);

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={hasWarning ? "#e2584b" : "#7dd3a8"} stopOpacity={0.35} />
              <stop offset="95%" stopColor={hasWarning ? "#e2584b" : "#7dd3a8"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="balance"
            stroke={hasWarning ? "#e2584b" : "#7dd3a8"}
            strokeWidth={2}
            fill="url(#sparkFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
