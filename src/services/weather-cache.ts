type CacheEntry = {
	data: unknown;
	expiresAt: number;
};

class WeatherCache {
	private cache = new Map<string, CacheEntry>();
	private inflight = new Map<string, Promise<unknown>>();
	private backoff = new Map<string, number>();

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry || Date.now() > entry.expiresAt) {
			if (entry) this.cache.delete(key);
			return null;
		}
		return entry.data as T;
	}

	set(key: string, data: unknown, ttlMs: number): void {
		this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
	}

	/**
	 * Deduplicated fetch-or-cache. Returns cached data if available,
	 * coalesces concurrent requests for the same key, and backs off
	 * for 60 s after a failure to avoid hammering a down API.
	 */
	async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
		const cached = this.get<T>(key);
		if (cached) return cached;

		const backoffUntil = this.backoff.get(key);
		if (backoffUntil && Date.now() < backoffUntil) {
			throw new Error(`Backoff active for ${key}`);
		}

		const existing = this.inflight.get(key);
		if (existing) return existing as Promise<T>;

		const promise = fetcher()
			.then((data) => {
				this.set(key, data, ttlMs);
				this.inflight.delete(key);
				this.backoff.delete(key);
				return data;
			})
			.catch((err) => {
				this.inflight.delete(key);
				this.backoff.set(key, Date.now() + 60_000);
				throw err;
			});

		this.inflight.set(key, promise);
		return promise;
	}

	invalidate(key: string): void {
		this.cache.delete(key);
	}

	invalidateByPrefix(prefix: string): void {
		for (const key of this.cache.keys()) {
			if (key.startsWith(prefix)) this.cache.delete(key);
		}
		for (const key of this.inflight.keys()) {
			if (key.startsWith(prefix)) this.inflight.delete(key);
		}
		for (const key of this.backoff.keys()) {
			if (key.startsWith(prefix)) this.backoff.delete(key);
		}
	}

	invalidateAll(): void {
		this.cache.clear();
		this.inflight.clear();
		this.backoff.clear();
	}
}

export const cache = new WeatherCache();
