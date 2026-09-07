/**
 * Temporary request timing for Vercel logs.
 * Enable with env BIDBOARD_TIMING=1. One JSON line per homepage render.
 * Remove after the investigation — not required for the product.
 */
export function timeit<T>(
  label: string,
  fn: () => Promise<T>,
  bag: Record<string, number>
): Promise<T> {
  const start = Date.now();
  return fn().finally(() => {
    bag[label] = Date.now() - start;
  });
}

export function logTiming(payload: Record<string, unknown>) {
  if (process.env.BIDBOARD_TIMING !== "1") return;
  console.info("[bidboard-timing]", JSON.stringify(payload));
}
