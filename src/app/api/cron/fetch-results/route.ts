import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchFinishedMatches } from "@/lib/football-api";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const finishedMatches = await fetchFinishedMatches();

  let updated = 0;

  for (const result of finishedMatches) {
    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("external_id", result.externalId)
      .single();

    if (!match) continue;

    const { data: existing } = await supabase
      .from("match_results")
      .select("source")
      .eq("match_id", match.id)
      .single();

    if (existing?.source === "manual") continue;

    const { error } = await supabase
      .from("match_results")
      .upsert(
        {
          match_id: match.id,
          home_score: result.homeScore,
          away_score: result.awayScore,
          source: "api" as const,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id" }
      );

    if (!error) updated++;
  }

  return NextResponse.json({ updated });
}
