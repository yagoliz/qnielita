/**
 * Maps FIFA 3-letter team codes (as stored in `teams.code`) to the
 * ISO 3166-1 alpha-2 codes used by flagcdn.com. UK home nations use
 * flagcdn's GB subdivision codes (gb-eng, gb-sct).
 *
 * Knockout placeholder codes (1A, 2B, 3ABCDF, W74, L101, ...) are not
 * countries, so they are intentionally absent and resolve to no flag.
 */
const FIFA_TO_ISO: Record<string, string> = {
  // Group A
  MEX: "mx", KOR: "kr", CZE: "cz", RSA: "za",
  // Group B
  CAN: "ca", QAT: "qa", SUI: "ch", BIH: "ba",
  // Group C
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  // Group D
  USA: "us", AUS: "au", TUR: "tr", PAR: "py",
  // Group E
  GER: "de", CIV: "ci", ECU: "ec", CUW: "cw",
  // Group F
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  // Group G
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  // Group H
  ESP: "es", KSA: "sa", URU: "uy", CPV: "cv",
  // Group I
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  // Group J
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  // Group K
  POR: "pt", UZB: "uz", COL: "co", COD: "cd",
  // Group L
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

/**
 * Returns the flagcdn image URL for a team `code`, or `null` when the code
 * has no associated country (placeholders, unknown, or empty codes).
 */
export function flagUrl(code: string | null | undefined): string | null {
  if (!code) return null;
  const iso = FIFA_TO_ISO[code];
  if (!iso) return null;
  return `https://flagcdn.com/w40/${iso}.png`;
}