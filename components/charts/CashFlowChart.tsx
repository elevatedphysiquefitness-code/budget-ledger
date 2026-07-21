"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayForecast } from "@/lib/computations/cashFlowForecast";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CashFlowChart({ days }: { days: DayForecast[] }) {
  const data = days.map((d) => ({ date: d.date.slice(5), balance: d.projectedBalance }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7dd3a8" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#7dd3a8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#262b31" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8b929c", fontSize: 11 }}
            axisLine={{ stroke: "#262b31" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "#8b929c", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => currency.format(v)}
            width={64}
          />
          <Tooltip
            contentStyle={{ background: "#1a1e23", border: "1px solid #262b31", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e7e9ec" }}
            formatter={(value) => [currency.format(Number(value)), "Projected balance"]}
          />
          <ReferenceLine y={0} stroke="#e2584b" strokeDasharray="4 4" />
          <ReferenceLine y={100} stroke="#e2a83b" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="balance" stroke="#7dd3a8" strokeWidth={2} fill="url(#balanceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
