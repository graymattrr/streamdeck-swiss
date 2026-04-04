type CacheEntry = {
	data: unknown;
	expiresAt: number;
};

class WeatherCache {
	private cache = new Map<string, CacheEntry>();

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

	invalidate(key: string): void {
		this.cache.delete(key);
	}

	invalidateAll(): void {
		this.cache.clear();
	}
}

export const cache = new WeatherCache();
