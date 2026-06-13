"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RankingChartData } from "@/lib/leaderboard";

export function RankingEvolutionChart({ data }: { data: RankingChartData }) {
  if (!data.hasEnoughSnapshots) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-400">
        La evolución aparecerá cuando haya al menos dos actualizaciones del ranking.
      </div>
    );
  }

  return (
    <div className="h-44 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.points} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            minTickGap={18}
          />
          <YAxis
            reversed
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            labelClassName="text-xs text-gray-500"
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
              fontSize: 12,
            }}
            formatter={(value, name) => [`#${value}`, name]}
          />
          {data.series.map((serie) => (
            <Line
              key={serie.userId}
              type="monotone"
              dataKey={serie.userId}
              name={serie.name}
              stroke={serie.isCurrentUser ? "#16a34a" : "#cbd5e1"}
              strokeWidth={serie.isCurrentUser ? 4 : 2}
              dot={serie.isCurrentUser ? { r: 3 } : false}
              activeDot={{ r: serie.isCurrentUser ? 5 : 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}