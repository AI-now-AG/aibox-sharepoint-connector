const cache = new Map();

export async function cached<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>
): Promise<T> {
    const now = Date.now();
    const existing = cache.get(key);
    if (existing && now - existing.time < ttl) return existing.data;
    const data = await fetcher();
    cache.set(key, { time: now, data });
    return data;
}