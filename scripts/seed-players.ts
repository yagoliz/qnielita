import * as fs from "fs";

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

if (!API_KEY) {
  console.error("Set FOOTBALL_DATA_API_KEY env var");
  process.exit(1);
}

const TEAM_CODE_MAP: Record<string, string> = {
  MEX: "MEX", KOR: "KOR", CZE: "CZE", RSA: "RSA",
  CAN: "CAN", QAT: "QAT", SUI: "SUI", BIH: "BIH",
  BRA: "BRA", MAR: "MAR", HAI: "HAI", SCO: "SCO",
  USA: "USA", AUS: "AUS", TUR: "TUR", PAR: "PAR",
  GER: "GER", CIV: "CIV", ECU: "ECU", CUW: "CUW",
  NED: "NED", JPN: "JPN", SWE: "SWE", TUN: "TUN",
  BEL: "BEL", EGY: "EGY", IRN: "IRN", NZL: "NZL",
  ESP: "ESP", KSA: "KSA", URU: "URU", CPV: "CPV",
  FRA: "FRA", SEN: "SEN", IRQ: "IRQ", NOR: "NOR",
  ARG: "ARG", ALG: "ALG", AUT: "AUT", JOR: "JOR",
  POR: "POR", UZB: "UZB", COL: "COL", COD: "COD",
  ENG: "ENG", CRO: "CRO", GHA: "GHA", PAN: "PAN",
};

type ApiPlayer = {
  name: string;
  position: string | null;
};

type ApiTeam = {
  tla: string;
  squad: ApiPlayer[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Auth-Token": API_KEY! },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function main() {
  console.log("Fetching World Cup 2026 teams...");

  const competition = await fetchJson<{ teams: ApiTeam[] }>(
    `${API_BASE}/competitions/WC/teams`
  );

  const lines: string[] = [
    "-- Auto-generated player seed data",
    "-- Run: FOOTBALL_DATA_API_KEY=xxx npx tsx scripts/seed-players.ts",
    "",
    "INSERT INTO players (name, team_id, position) VALUES",
  ];

  const values: string[] = [];

  for (const team of competition.teams) {
    const dbCode = TEAM_CODE_MAP[team.tla];
    if (!dbCode) {
      console.warn(`Skipping unknown team code: ${team.tla}`);
      continue;
    }

    if (!team.squad || team.squad.length === 0) {
      console.warn(`No squad data for ${team.tla}`);
      continue;
    }

    for (const player of team.squad) {
      const name = player.name.replace(/'/g, "''");
      const position = player.position ?? "Unknown";
      values.push(
        `  ('${name}', (SELECT id FROM teams WHERE code = '${dbCode}'), '${position}')`
      );
    }
  }

  lines.push(values.join(",\n") + ";");
  lines.push("");

  const outputPath = "supabase/seed_players.sql";
  fs.writeFileSync(outputPath, lines.join("\n"));
  console.log(`Written ${values.length} players to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});