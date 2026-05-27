import Link from "next/link";

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
}: MatchPreviewCardProps) {
  const stageLabel = match.stage === "group" ? "Grupos" : match.stage;

  const inner = (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase">
          {stageLabel}
        </span>
        <span className="text-xs text-gray-400">
          {formatKickoff(match.kickoff_at)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm">{match.home_team?.name ?? "?"}</p>
          <p className="text-xs text-gray-400">{match.home_team?.code ?? ""}</p>
        </div>

        <div className="flex items-center gap-1">
          <ScoreBox value={prediction?.home_score ?? null} />
          <span className="text-gray-300 font-bold">-</span>
          <ScoreBox value={prediction?.away_score ?? null} />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">{match.away_team?.name ?? "?"}</p>
          <p className="text-xs text-gray-400">{match.away_team?.code ?? ""}</p>
        </div>
      </div>

      {result && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">
            Resultado: {result.home_score} - {result.away_score}
          </span>
          {prediction?.points_earned != null && (
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