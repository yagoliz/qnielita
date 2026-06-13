import type { LeaderboardEntry } from "@/lib/leaderboard";
import { CircleDot, Dices, Swords, Trophy } from "lucide-react";
import Link from "next/link";

export function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {entries.map((entry) => {
        const isMe = entry.user_id === currentUserId;
        return (
          <Link
            key={entry.user_id}
            href={`/clasificacion/${entry.user_id}`}
            className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-gray-50 p-3 last:border-b-0 ${
              isMe ? "bg-green-50 shadow-[inset_3px_0_0_#16a34a]" : "hover:bg-gray-50"
            }`}
          >
            <span className="text-base font-black text-green-600">{entry.rank}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {entry.avatar_emoji} {entry.display_name}{isMe ? " (tú)" : ""}
              </span>
              <span className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                <span><CircleDot className="inline size-3" /> {entry.match_points}</span>
                <span><Trophy className="inline size-3" /> {entry.tournament_points}</span>
                <span><Dices className="inline size-3" /> {entry.custom_points}</span>
                <span><Swords className="inline size-3" /> {entry.bracket_points}</span>
              </span>
            </span>
            <span className="text-right text-base font-black">{entry.total_points}</span>
          </Link>
        );
      })}
    </div>
  );
}