"use client";

import { BracketMatch, type BracketMatchData } from "./bracket-match";
import { KNOCKOUT_LABELS, type KnockoutStage } from "@/lib/match-tree";

type Props = {
  stage: KnockoutStage;
  matches: BracketMatchData[];
  locked: boolean;
  onScoreChange: (matchId: number, side: "home" | "away", value: number) => void;
  onPenaltyChange: (matchId: number, winner: "home" | "away") => void;
};

export function BracketStage({ stage, matches, locked, onScoreChange, onPenaltyChange }: Props) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-green-600 mb-2">
        {KNOCKOUT_LABELS[stage]}
      </h3>
      <div className="space-y-2">
        {matches.map((m) => (
          <BracketMatch
            key={m.matchId}
            match={m}
            locked={locked}
            onScoreChange={onScoreChange}
            onPenaltyChange={onPenaltyChange}
          />
        ))}
      </div>
    </div>
  );
}
