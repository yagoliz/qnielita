// Slot-agnostic comparison of a user's predicted knockout matchup against the
// teams that actually reached the match. Mirrors the bracket scoring rule in
// supabase/migrations/00005_bracket_partial_score.sql: a predicted team counts
// if it appears on either side of the actual match.

export type ComparisonTeam = { id: number; name: string; code: string };

export type TeamSlot = {
  predicted: ComparisonTeam | null;
  actual: ComparisonTeam | null;
  status: "correct" | "wrong" | "unknown";
};

export type BracketComparison = { home: TeamSlot; away: TeamSlot };

// Real teams use 3-letter ISO codes (ESP, NED). Every placeholder team
// (group/third-place slots like 1A / 3ABCDF, feeders like W77 / L101) is
// non-3-letter, so this distinguishes "actual team known" from "still a slot".
export function isRealTeamCode(code: string | null | undefined): boolean {
  return !!code && /^[A-Z]{3}$/.test(code);
}

export function buildBracketTeamComparison(
  predictedHome: ComparisonTeam | null,
  predictedAway: ComparisonTeam | null,
  actualHome: ComparisonTeam | null,
  actualAway: ComparisonTeam | null
): BracketComparison {
  // No feeder decided yet → nothing to compare on either side.
  if (!actualHome && !actualAway) {
    return {
      home: { predicted: predictedHome, actual: null, status: "unknown" },
      away: { predicted: predictedAway, actual: null, status: "unknown" },
    };
  }

  // Exactly one feeder decided (the other match hasn't been played). Evaluate
  // each side independently: a side whose own slot is resolved gets its verdict
  // now (or is already correct if the decided team is its pick, slot-agnostic);
  // a side still feeding from an undecided match waits.
  if (!actualHome || !actualAway) {
    const known = (actualHome ?? actualAway)!;
    const evalSide = (
      predicted: ComparisonTeam | null,
      slotActual: ComparisonTeam | null
    ): TeamSlot => {
      if (predicted && predicted.id === known.id) {
        return { predicted, actual: predicted, status: "correct" };
      }
      if (slotActual) {
        return { predicted, actual: slotActual, status: "wrong" };
      }
      return { predicted, actual: null, status: "unknown" };
    };
    return {
      home: evalSide(predictedHome, actualHome),
      away: evalSide(predictedAway, actualAway),
    };
  }

  const actualIds = new Set([actualHome.id, actualAway.id]);
  const homeCorrect = predictedHome != null && actualIds.has(predictedHome.id);
  const awayCorrect = predictedAway != null && actualIds.has(predictedAway.id);

  // Real teams the user did NOT correctly predict, to fill the wrong slots.
  const matchedIds = new Set<number>();
  if (homeCorrect) matchedIds.add(predictedHome!.id);
  if (awayCorrect) matchedIds.add(predictedAway!.id);
  const leftovers = [actualHome, actualAway].filter((tm) => !matchedIds.has(tm.id));
  let li = 0;

  const home: TeamSlot = homeCorrect
    ? { predicted: predictedHome, actual: predictedHome, status: "correct" }
    : { predicted: predictedHome, actual: leftovers[li++] ?? null, status: "wrong" };

  const away: TeamSlot = awayCorrect
    ? { predicted: predictedAway, actual: predictedAway, status: "correct" }
    : { predicted: predictedAway, actual: leftovers[li++] ?? null, status: "wrong" };

  return { home, away };
}