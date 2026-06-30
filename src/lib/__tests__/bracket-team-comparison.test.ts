import { describe, it, expect } from "vitest";
import {
  buildBracketTeamComparison,
  isRealTeamCode,
} from "../bracket-team-comparison";

const t = (id: number) => ({ id, name: `T${id}`, code: `T${id}` });

describe("isRealTeamCode", () => {
  it("accepts 3-letter ISO codes", () => {
    expect(isRealTeamCode("ESP")).toBe(true);
    expect(isRealTeamCode("NED")).toBe(true);
  });
  it("rejects placeholder codes and empties", () => {
    expect(isRealTeamCode("W77")).toBe(false);
    expect(isRealTeamCode("1A")).toBe(false);
    expect(isRealTeamCode("3ABCDF")).toBe(false);
    expect(isRealTeamCode("L101")).toBe(false);
    expect(isRealTeamCode("")).toBe(false);
    expect(isRealTeamCode(null)).toBe(false);
    expect(isRealTeamCode(undefined)).toBe(false);
  });
});

describe("buildBracketTeamComparison", () => {
  it("both correct, slots aligned", () => {
    const c = buildBracketTeamComparison(t(1), t(2), t(1), t(2));
    expect(c.home).toEqual({ predicted: t(1), actual: t(1), status: "correct" });
    expect(c.away).toEqual({ predicted: t(2), actual: t(2), status: "correct" });
  });

  it("both correct, slots swapped (slot-agnostic)", () => {
    const c = buildBracketTeamComparison(t(1), t(2), t(2), t(1));
    expect(c.home.status).toBe("correct");
    expect(c.home.actual).toEqual(t(1));
    expect(c.away.status).toBe("correct");
    expect(c.away.actual).toEqual(t(2));
  });

  it("one correct (home), away shows the real replacement", () => {
    const c = buildBracketTeamComparison(t(1), t(2), t(1), t(3));
    expect(c.home).toEqual({ predicted: t(1), actual: t(1), status: "correct" });
    expect(c.away).toEqual({ predicted: t(2), actual: t(3), status: "wrong" });
  });

  it("one correct (home, but appears in away slot)", () => {
    const c = buildBracketTeamComparison(t(1), t(2), t(3), t(1));
    expect(c.home).toEqual({ predicted: t(1), actual: t(1), status: "correct" });
    expect(c.away).toEqual({ predicted: t(2), actual: t(3), status: "wrong" });
  });

  it("both wrong, each pill shows a distinct real team", () => {
    const c = buildBracketTeamComparison(t(1), t(2), t(3), t(4));
    expect(c.home).toEqual({ predicted: t(1), actual: t(3), status: "wrong" });
    expect(c.away).toEqual({ predicted: t(2), actual: t(4), status: "wrong" });
  });

  it("unknown when NO actual team is decided yet", () => {
    const c = buildBracketTeamComparison(t(1), t(2), null, null);
    expect(c.home).toEqual({ predicted: t(1), actual: null, status: "unknown" });
    expect(c.away).toEqual({ predicted: t(2), actual: null, status: "unknown" });
  });

  it("partial: home decided against the pick, away still pending", () => {
    // Predicted Germany(1) vs France(2). Home slot resolved to Paraguay(3);
    // away feeder not played yet.
    const c = buildBracketTeamComparison(t(1), t(2), t(3), null);
    expect(c.home).toEqual({ predicted: t(1), actual: t(3), status: "wrong" });
    expect(c.away).toEqual({ predicted: t(2), actual: null, status: "unknown" });
  });

  it("partial: decided side matches the pick (green now)", () => {
    const c = buildBracketTeamComparison(t(1), t(2), t(1), null);
    expect(c.home).toEqual({ predicted: t(1), actual: t(1), status: "correct" });
    expect(c.away).toEqual({ predicted: t(2), actual: null, status: "unknown" });
  });

  it("partial: only the away slot is decided", () => {
    const c = buildBracketTeamComparison(t(1), t(2), null, t(3));
    expect(c.home).toEqual({ predicted: t(1), actual: null, status: "unknown" });
    expect(c.away).toEqual({ predicted: t(2), actual: t(3), status: "wrong" });
  });

  it("partial: pick appears in the decided OTHER slot (slot-agnostic correct)", () => {
    // Predicted home=1, away=3. Home slot resolved to team 3 (the away pick),
    // away slot pending → away pick is already correct, home is wrong.
    const c = buildBracketTeamComparison(t(1), t(3), t(3), null);
    expect(c.home).toEqual({ predicted: t(1), actual: t(3), status: "wrong" });
    expect(c.away).toEqual({ predicted: t(3), actual: t(3), status: "correct" });
  });

  it("missing prediction is wrong and gets a leftover real team", () => {
    const c = buildBracketTeamComparison(null, t(2), t(2), t(5));
    expect(c.away).toEqual({ predicted: t(2), actual: t(2), status: "correct" });
    expect(c.home).toEqual({ predicted: null, actual: t(5), status: "wrong" });
  });
});