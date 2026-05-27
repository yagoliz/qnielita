import { MatchResultRow, type Match } from "./match-result-row";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function GroupStageResults({ matches }: { matches: Match[] }) {
  const sorted = [...matches].sort(
    (a, b) =>
      new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No hay partidos de fase de grupos disponibles aún.
      </p>
    );
  }

  const groupedByDate = new Map<string, Match[]>();
  for (const m of sorted) {
    const key = formatDate(m.kickoff_at);
    const arr = groupedByDate.get(key) ?? [];
    arr.push(m);
    groupedByDate.set(key, arr);
  }

  return (
    <div className="space-y-4">
      {Array.from(groupedByDate.entries()).map(([date, dateMatches]) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            {date}
          </h3>
          <div className="space-y-2">
            {dateMatches.map((match) => (
              <MatchResultRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}