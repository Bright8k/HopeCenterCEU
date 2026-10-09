/** Builds a thenable chain stub for Supabase query builder calls. */

type DBResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

function makeChain(result: DBResult) {
  const c: Record<string, unknown> = {};
  const noop = () => c;
  const methods = [
    'select', 'eq', 'neq', 'or', 'gte', 'lte', 'not', 'is',
    'order', 'limit', 'single', 'maybeSingle', 'returns',
    'upsert', 'insert', 'update', 'delete', 'head',
  ];
  for (const m of methods) c[m] = jest.fn(noop);
  (c as any).then = (
    resolve: (v: DBResult) => unknown,
    reject?: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return c as any;
}

/**
 * Creates a jest-mocked supabase module.
 *
 * Pass `tableResults` to map table name → the DB result that query resolves to.
 * When a table is called multiple times, pass an array — each element is
 * consumed in order (subsequent calls fall back to the last entry).
 */
export function createMockSupabase(
  tableResults: Record<string, DBResult | DBResult[]> = {},
) {
  const callCounters: Record<string, number> = {};

  const fromFn = jest.fn((table: string) => {
    const entry = tableResults[table];
    if (!entry) return makeChain({ data: null, error: null, count: null });
    if (Array.isArray(entry)) {
      const idx = callCounters[table] ?? 0;
      callCounters[table] = idx + 1;
      return makeChain(entry[Math.min(idx, entry.length - 1)]);
    }
    return makeChain(entry);
  });

  return {
    hasSupabaseEnv: true,
    supabase: {
      from: fromFn,
      functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    },
  };
}
