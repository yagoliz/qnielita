import { MatchResultRow, type Match } from "./match-result-row";

const KNOCKOUT_ROUNDS = [
  { stage: "R32", label: "Dieciseisavos" },
  { stage: "R16", label: "Octavos" },
  { stage: "QF", label: "Cuartos" },
  { stage: "SF", label: "Semifinales" },
  { stage: "third_place", label: "Tercer puesto" },
  { stage: "final", label: "Final" },
] as const;

export function KnockoutStageResults({ matches, overrideLock }: { matches: Match[]; overrideLock: boolean }) {
  return (
    <div className="space-y-4">
      {KNOCKOUT_ROUNDS.map(({ stage, label }) => {
        const roundMatches = matches
          .filter((m) => m.stage === stage)
          .sort(
            (a, b) =>
              new Date(a.kickoff_at).getTime() -
              new Date(b.kickoff_at).getTime()
          );
        const withResult = roundMatches.filter((m) => m.result).length;

        return (
          <div key={stage}>
            <h3 className="text-sm font-semibold text-green-600 mb-2">
              {label}
              {roundMatches.length > 0 && (
                <span className="text-gray-400 font-normal ml-1">
                  ({withResult}/{roundMatches.length})
                </span>
              )}
            </h3>
            {roundMatches.length === 0 ? (
              <p className="text-gray-400 text-xs pl-1">
                Sin partidos disponibles aún
              </p>
            ) : (
              <div className="space-y-2">
                {roundMatches.map((match) => (
                  <MatchResultRow key={match.id} match={match} overrideLock={overrideLock} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}