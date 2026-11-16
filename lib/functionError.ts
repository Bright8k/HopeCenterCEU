/** Reads the `{ error }` message an Edge Function returned with a non-2xx status. */
export async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: unknown };
      if (typeof body.error === 'string' && body.error) return body.error;
    } catch {
      // Body was not JSON; use the fallback
    }
  }
  return fallback;
}
