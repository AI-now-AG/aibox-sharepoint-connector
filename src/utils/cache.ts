// ---------------------------------------------------------------------
// Simple in-memory cache using Map()
// This cache exists only in RAM for the current server instance.
// In a multi-server or serverless environment, each instance gets its own cache.
// ---------------------------------------------------------------------

const MAX_CACHE_SIZE = 100; // maximum number of entries

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { time: number; data: any }>();

export async function cached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);

  // Return cached data if not expired
  if (existing && now - existing.time < ttl * 1000) {
    return existing.data;
  }

  // Evict oldest entry if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const iterator = cache.keys().next();
    const oldestKey = iterator.value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  // Fetch new data and store in cache
  const data = await fetcher();
  cache.set(key, { time: now, data });
  return data;
}

export function clearAllCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${prefix}:`)) cache.delete(key);
  }
}
