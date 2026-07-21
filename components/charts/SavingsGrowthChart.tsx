"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SavingsProjectionPoint } from "@/lib/computations/savingsGrowth";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function SavingsGrowthChart({ points }: { points: SavingsProjectionPoint[] }) {
  const data = points.map((p) => ({ date: p.date.slice(0, 7), balance: p.balance }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#262b31" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#8b929c", fontSize: 11 }} axisLine={{ stroke: "#262b31" }} tickLine={false} minTickGap={30} />
          <YAxis
            tick={{ fill: "#8b929c", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => currency.format(v)}
            width={56}
          />
          <Tooltip
            contentStyle={{ background: "#1a1e23", border: "1px solid #262b31", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e7e9ec" }}
            formatter={(value) => [currency.format(Number(value)), "Balance"]}
          />
          <Line type="monotone" dataKey="balance" stroke="#34c78a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
