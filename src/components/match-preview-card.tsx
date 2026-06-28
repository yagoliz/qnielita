import Link from "next/link";
import { TeamFlag } from "./team-flag";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type MatchPreviewCardProps = {
  match: {
    id: number;
    kickoff_at: string;
    stage: string;
    home_team: { name: string; code: string } | null;
    away_team: { name: string; code: string } | null;
  };
  prediction?: {
    home_score: number;
    away_score: number;
    points_earned: number | null;
  } | null;
  result?: {
    home_score: number;
    away_score: number;
  } | null;
  href?: string;
  /**
   * Where to render the earned-points indicator:
   * - "inline" (default): green "+N pts" next to the Resultado line.
   * - "badge": rounded green badge in the card's top-right corner.
   */
  pointsVariant?: "inline" | "badge";
};

function ScoreBox({ value }: { value: number | null }) {
  return (
    <div className="w-12 h-12 flex items-center justify-center text-lg font-bold border border-gray-300 rounded-lg bg-gray-100 text-gray-400">
      {value ?? "—"}
    </div>
  );
}

export function MatchPreviewCard({
  match,
  prediction,
  result,
  href,
  pointsVariant = "inline",
}: MatchPreviewCardProps) {
  const stageLabel = match.stage === "group" ? "Grupos" : match.stage;
  const showBadge =
    pointsVariant === "badge" && prediction?.points_earned != null;

  const inner = (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {stageLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {formatKickoff(match.kickoff_at)}
          </span>
          {showBadge && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-black text-green-700">
              +{prediction!.points_earned} pts
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm">{match.home_team?.name ?? "?"}</p>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs text-gray-400">{match.home_team?.code ?? ""}</span>
            <TeamFlag code={match.home_team?.code} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ScoreBox value={prediction?.home_score ?? null} />
          <span className="text-gray-300 font-bold">-</span>
          <ScoreBox value={prediction?.away_score ?? null} />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">{match.away_team?.name ?? "?"}</p>
          <div className="flex items-center gap-1.5">
            <TeamFlag code={match.away_team?.code} />
            <span className="text-xs text-gray-400">{match.away_team?.code ?? ""}</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            Resultado: {result.home_score} - {result.away_score}
          </span>
          {pointsVariant === "inline" && prediction?.points_earned != null && (
            <span className="ml-2 text-xs font-bold text-green-600">
              +{prediction.points_earned} pts
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}