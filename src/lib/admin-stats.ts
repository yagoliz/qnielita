/**
 * Counts rows in a table grouped by `user_id`, paginating past PostgREST's
 * default row cap (1000). Fetching all rows and counting client-side without
 * pagination silently truncates once a table exceeds that cap, which made the
 * admin "Usuarios" prediction counts wrong for the tail users once the pool
 * grew beyond ~1000 total predictions.
 */

const PAGE_SIZE = 1000;

type UserRow = { user_id: string };

type RangeResult = { data: UserRow[] | null; error: unknown };

export type PaginatedClient = {
  from(table: string): {
    select(columns: string): {
      range(from: number, to: number): PromiseLike<RangeResult>;
    };
  };
};

export async function countByUser(
  client: PaginatedClient,
  table: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select("user_id")
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) break;

    for (const row of data) {
      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
    }

    if (data.length < PAGE_SIZE) break;
  }

  return counts;
}
