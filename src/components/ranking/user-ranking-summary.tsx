import type { LeaderboardEntry } from "@/lib/leaderboard";
import { CircleDot, Dices, Swords, Trophy } from "lucide-react";

function podiumGap(entry: LeaderboardEntry, entries: LeaderboardEntry[]): string | null {
  if (entry.rank <= 3) return "En puestos de podio";
  const third = entries.find((candidate) => candidate.rank === 3);
  if (!third) return null;
  const gap = third.total_points - entry.total_points;
  if (gap <= 0) return "A un desempate del podio";
  return `A ${gap} pts del podio`;
}

export function UserRankingSummary({
  entry,
  entries,
  title = "Tu puesto",
}: {
  entry: LeaderboardEntry;
  entries: LeaderboardEntry[];
  title?: string;
}) {
  const gap = podiumGap(entry, entries);

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm shadow-green-100/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-600">{title}</p>
          <p className="mt-1 text-3xl font-black tracking-tight">#{entry.rank}</p>
          <p className="text-sm text-gray-500">
            {entry.avatar_emoji} {entry.display_name} · {entry.total_points} pts
          </p>
        </div>
        {gap && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            {gap}
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-gray-500">
        <div className="rounded-xl bg-gray-50 p-2"><CircleDot className="mx-auto size-3.5" /><b className="block text-sm text-gray-900">{entry.match_points}</b>Part.</div>
        <div className="rounded-xl bg-gray-50 p-2"><Trophy className="mx-auto size-3.5" /><b className="block text-sm text-gray-900">{entry.tournament_points}</b>Torneo</div>
        <div className="rounded-xl bg-gray-50 p-2"><Dices className="mx-auto size-3.5" /><b className="block text-sm text-gray-900">{entry.custom_points}</b>Locas</div>
        <div className="rounded-xl bg-gray-50 p-2"><Swords className="mx-auto size-3.5" /><b className="block text-sm text-gray-900">{entry.bracket_points}</b>Bracket</div>
      </div>
    </div>
  );
}