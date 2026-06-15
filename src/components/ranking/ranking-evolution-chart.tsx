"use client";

import dynamic from "next/dynamic";

/**
 * Recharts is heavy (~45KB gz) and only ever renders on the ranking pages.
 * Load it client-side after paint so it stays out of the initial render path;
 * the placeholder reserves the chart's height (h-52) to avoid layout shift.
 */
export const RankingEvolutionChart = dynamic(
  () =>
    import("./ranking-evolution-chart-impl").then(
      (m) => m.RankingEvolutionChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />
    ),
  }
);
