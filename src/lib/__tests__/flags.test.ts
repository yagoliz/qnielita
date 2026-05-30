import { describe, expect, test } from "vitest";
import { flagUrl } from "@/lib/flags";

describe("flagUrl", () => {
  test("maps a standard FIFA code to its flagcdn ISO url", () => {
    expect(flagUrl("MEX")).toBe("https://flagcdn.com/w40/mx.png");
    expect(flagUrl("RSA")).toBe("https://flagcdn.com/w40/za.png");
    expect(flagUrl("GER")).toBe("https://flagcdn.com/w40/de.png");
  });

  test("maps UK home nations to flagcdn subdivision codes", () => {
    expect(flagUrl("ENG")).toBe("https://flagcdn.com/w40/gb-eng.png");
    expect(flagUrl("SCO")).toBe("https://flagcdn.com/w40/gb-sct.png");
  });

  test("returns null for knockout placeholder codes", () => {
    expect(flagUrl("1A")).toBeNull();
    expect(flagUrl("2B")).toBeNull();
    expect(flagUrl("3ABCDF")).toBeNull();
    expect(flagUrl("W74")).toBeNull();
    expect(flagUrl("L101")).toBeNull();
  });

  test("returns null for unknown or empty codes", () => {
    expect(flagUrl("ZZZ")).toBeNull();
    expect(flagUrl("")).toBeNull();
    expect(flagUrl(undefined)).toBeNull();
  });

  test("has a known ISO mapping for every one of the 48 real teams", () => {
    const codes = [
      "MEX", "KOR", "CZE", "RSA", "CAN", "QAT", "SUI", "BIH",
      "BRA", "MAR", "HAI", "SCO", "USA", "AUS", "TUR", "PAR",
      "GER", "CIV", "ECU", "CUW", "NED", "JPN", "SWE", "TUN",
      "BEL", "EGY", "IRN", "NZL", "ESP", "KSA", "URU", "CPV",
      "FRA", "SEN", "IRQ", "NOR", "ARG", "ALG", "AUT", "JOR",
      "POR", "UZB", "COL", "COD", "ENG", "CRO", "GHA", "PAN",
    ];
    for (const code of codes) {
      expect(flagUrl(code), `missing flag for ${code}`).not.toBeNull();
    }
  });
});
