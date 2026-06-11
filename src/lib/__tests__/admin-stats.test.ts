import { describe, it, expect } from "vitest";
import { countByUser, type PaginatedClient } from "@/lib/admin-stats";

/**
 * Builds a fake Supabase-like client that serves the given rows in pages,
 * mimicking PostgREST's behaviour of capping each response at 1000 rows
 * regardless of the requested range.
 */
function fakeClient(rows: { user_id: string }[]): PaginatedClient {
  const SERVER_CAP = 1000;
  return {
    from() {
      return {
        select() {
          return {
            range(from: number, to: number) {
              const requested = rows.slice(from, to + 1);
              const data = requested.slice(0, SERVER_CAP);
              return Promise.resolve({ data, error: null });
            },
          };
        },
      };
    },
  };
}

function rowsFor(counts: Record<string, number>): { user_id: string }[] {
  const rows: { user_id: string }[] = [];
  for (const [user, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) rows.push({ user_id: user });
  }
  return rows;
}

describe("countByUser", () => {
  it("counts correctly when under the page cap", async () => {
    const counts = await countByUser(
      fakeClient(rowsFor({ a: 5, b: 3 })),
      "match_predictions"
    );
    expect(counts.get("a")).toBe(5);
    expect(counts.get("b")).toBe(3);
  });

  it("does not truncate when total rows exceed the 1000-row cap", async () => {
    // 16 users x 72 = 1152 predictions, mirroring the production data that
    // exposed the bug. Without pagination the tail users were undercounted.
    const expected: Record<string, number> = {};
    for (let u = 0; u < 16; u++) expected[`user-${u}`] = 72;

    const counts = await countByUser(
      fakeClient(rowsFor(expected)),
      "match_predictions"
    );

    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(1152);
    for (let u = 0; u < 16; u++) {
      expect(counts.get(`user-${u}`)).toBe(72);
    }
  });

  it("returns an empty map for no rows", async () => {
    const counts = await countByUser(fakeClient([]), "match_predictions");
    expect(counts.size).toBe(0);
  });
});
