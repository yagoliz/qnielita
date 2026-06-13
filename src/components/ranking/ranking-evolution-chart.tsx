"use client";

import { useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RankingChartData } from "@/lib/leaderboard";

const CURRENT_COLOR = "#16a34a";
const MUTED_COLOR = "#cbd5e1";
const HOVER_COLOR = "#475569";

export function RankingEvolutionChart({ data }: { data: RankingChartData }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!data.hasEnoughSnapshots) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-400">
        La evolución aparecerá cuando haya al menos dos actualizaciones del ranking.
      </div>
    );
  }

  const nameFor = (id: string) =>
    data.series.find((s) => s.userId === id)?.name ?? id;
  const currentId = data.series.find((s) => s.isCurrentUser)?.userId ?? null;

  return (
    <div className="h-52 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data.points}
          margin={{ top: 10, right: 12, bottom: 4, left: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            minTickGap={18}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, "dataMax"]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const points = new Map(
                payload.map(
                  (p) => [String(p.dataKey), Number(p.value)] as const
                )
              );
              const ids = activeId
                ? [activeId, currentId].filter(
                    (v, i, arr): v is string =>
                      v !== null && arr.indexOf(v) === i
                  )
                : data.series.map((s) => s.userId);
              const rows = ids
                .map((id) => ({
                  id,
                  name: nameFor(id),
                  points: points.get(id),
                  isCurrent: id === currentId,
                  isActive: id === activeId,
                }))
                .filter(
                  (r): r is typeof r & { points: number } =>
                    r.points !== undefined && !Number.isNaN(r.points)
                )
                .sort((a, b) => b.points - a.points);
              if (!rows.length) return null;
              return (
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between gap-4 ${
                        r.isCurrent
                          ? "font-bold text-green-700"
                          : r.isActive
                            ? "font-semibold text-slate-700"
                            : "text-gray-500"
                      }`}
                    >
                      <span className="truncate">{r.name}</span>
                      <span>{r.points} pts</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          {data.series.map((serie) => {
            const isActive = serie.userId === activeId;
            return (
              <Line
                key={serie.userId}
                type="monotone"
                dataKey={serie.userId}
                name={serie.name}
                stroke={
                  serie.isCurrentUser
                    ? CURRENT_COLOR
                    : isActive
                      ? HOVER_COLOR
                      : MUTED_COLOR
                }
                strokeWidth={serie.isCurrentUser ? 4 : isActive ? 3 : 2}
                dot={serie.isCurrentUser || isActive ? { r: 3 } : { r: 1.5 }}
                activeDot={{ r: serie.isCurrentUser ? 5 : 4 }}
                connectNulls
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActiveId(serie.userId)}
                onMouseLeave={() => setActiveId(null)}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}