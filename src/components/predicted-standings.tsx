import type { PredictedGroup } from "@/lib/group-standings";

function rowAccent(position: number): string {
  if (position <= 2) return "border-l-2 border-green-500 bg-green-50/40";
  if (position === 3) return "border-l-2 border-amber-400 bg-amber-50/40";
  return "border-l-2 border-transparent";
}

function GroupTable({ group }: { group: PredictedGroup }) {
  const missing = group.totalCount - group.predictedCount;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="font-semibold">Grupo {group.groupName}</h2>
        {missing > 0 && (
          <span className="text-xs text-gray-400">
            Faltan {missing} {missing === 1 ? "predicción" : "predicciones"}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase">
              <th className="py-2 pl-2 pr-1 text-left font-medium w-6">#</th>
              <th className="py-2 px-1 text-left font-medium">Equipo</th>
              <th className="py-2 px-1 text-center font-medium w-8">PJ</th>
              <th className="py-2 px-1 text-center font-medium w-8">GF</th>
              <th className="py-2 px-1 text-center font-medium w-8">GC</th>
              <th className="py-2 px-1 text-center font-medium w-8">DG</th>
              <th className="py-2 pl-1 pr-2 text-center font-semibold w-10">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((s, i) => {
              const team = group.teamsById[s.team_id];
              const position = i + 1;
              return (
                <tr
                  key={s.team_id}
                  className={`border-t border-gray-50 ${rowAccent(position)}`}
                >
                  <td className="py-2 pl-2 pr-1 text-gray-400 text-xs">
                    {position}
                  </td>
                  <td className="py-2 px-1">
                    <span className="font-medium">{team?.name ?? "?"}</span>
                    <span className="ml-1 text-xs text-gray-400">
                      {team?.code ?? ""}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center text-gray-500">
                    {s.played}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-500">{s.gf}</td>
                  <td className="py-2 px-1 text-center text-gray-500">{s.ga}</td>
                  <td className="py-2 px-1 text-center text-gray-500">
                    {s.gd > 0 ? `+${s.gd}` : s.gd}
                  </td>
                  <td className="py-2 pl-1 pr-2 text-center font-semibold">
                    {s.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PredictedStandings({ groups }: { groups: PredictedGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="text-gray-400 text-center mt-8">
        No hay grupos disponibles todavía.
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3 px-1">
        Clasificación según tus predicciones. Verde: clasifica directo · Ámbar:
        posible mejor tercero.
      </p>
      {groups.map((g) => (
        <GroupTable key={g.groupId} group={g} />
      ))}
    </div>
  );
}