import type { LeaderboardEntry } from "@/lib/leaderboard";

function PodiumCard({ entry, featured }: { entry: LeaderboardEntry; featured?: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-3 text-center shadow-sm ${
        featured ? "border-green-200 shadow-green-100" : "border-gray-100"
      }`}
    >
      <p className="text-[10px] font-black text-gray-400">#{entry.rank}</p>
      <div className={`mx-auto my-2 grid size-11 place-items-center rounded-full text-2xl ${featured ? "bg-green-100" : "bg-gray-50"}`}>
        {entry.avatar_emoji}
      </div>
      <p className="truncate text-xs font-bold">{entry.display_name}</p>
      <p className="text-xs text-gray-500">{entry.total_points} pts</p>
    </div>
  );
}

export function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  const topThree = entries.slice(0, 3);
  if (topThree.length === 0) return null;

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      {second ? <PodiumCard entry={second} /> : <div />}
      <div className="-mt-2">
        <PodiumCard entry={first} featured />
      </div>
      {third ? <PodiumCard entry={third} /> : <div />}
    </div>
  );
}