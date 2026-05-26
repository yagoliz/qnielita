const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION_ID = 2000; // FIFA World Cup

type ApiMatch = {
  id: number;
  status: string;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
};

type ApiResponse = {
  matches: ApiMatch[];
};

export async function fetchFinishedMatches(): Promise<
  Array<{ externalId: number; homeScore: number; awayScore: number }>
> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_API_KEY not configured");

  const res = await fetch(
    `${BASE_URL}/competitions/${COMPETITION_ID}/matches?status=FINISHED`,
    {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error(`Football API error: ${res.status} ${res.statusText}`);
  }

  const data: ApiResponse = await res.json();

  return data.matches
    .filter(
      (m) =>
        m.score.fullTime.home !== null && m.score.fullTime.away !== null
    )
    .map((m) => ({
      externalId: m.id,
      homeScore: m.score.fullTime.home!,
      awayScore: m.score.fullTime.away!,
    }));
}
