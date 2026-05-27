import { CircleDot, Trophy, Dices } from "lucide-react";
import Link from "next/link";

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  match_points: number;
  tournament_points: number;
  custom_points: number;
  total_points: number;
  rank: number;
};

export function LeaderboardTable({
  entries,
  currentUserId,
  compact,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
  compact?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-400 text-xs">
            <th className="py-2 px-3 text-left">#</th>
            <th className="py-2 px-3 text-left">Nombre</th>
            {!compact && (
              <>
                <th className="py-2 px-2 text-center"><CircleDot className="size-3.5 inline" /></th>
                <th className="py-2 px-2 text-center"><Trophy className="size-3.5 inline" /></th>
                <th className="py-2 px-2 text-center"><Dices className="size-3.5 inline" /></th>
              </>
            )}
            <th className="py-2 px-3 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <tr
                key={entry.user_id}
                className={`border-b border-gray-50 ${
                  isMe ? "bg-green-50" : ""
                }`}
              >
                <td className="py-2 px-3 font-medium">{entry.rank}</td>
                <td className="py-2 px-3">
                  <Link
                    href={`/clasificacion/${entry.user_id}`}
                    className="hover:text-green-600"
                  >
                    {entry.display_name}
                    {isMe && " (tú)"}
                  </Link>
                </td>
                {!compact && (
                  <>
                    <td className="py-2 px-2 text-center text-gray-500">
                      {entry.match_points}
                    </td>
                    <td className="py-2 px-2 text-center text-gray-500">
                      {entry.tournament_points}
                    </td>
                    <td className="py-2 px-2 text-center text-gray-500">
                      {entry.custom_points}
                    </td>
                  </>
                )}
                <td className="py-2 px-3 text-right font-bold">
                  {entry.total_points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
