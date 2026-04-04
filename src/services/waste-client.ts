import type { WasteCollection, WasteTypeKey } from "../types/waste.js";
import { cache } from "./weather-cache.js";

const BASE = "https://openerz.metaodi.ch/api/calendar.json";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

type OpenERZEntry = {
	date: string;
	waste_type: string;
	zip: number;
	area: string;
	region: string;
};

type OpenERZResponse = {
	total_count: number;
	row_count: number;
	result: OpenERZEntry[];
};

export async function fetchWasteSchedule(plz: string, area?: string): Promise<WasteCollection[]> {
	const cacheKey = `waste:${plz}:${area ?? "all"}`;
	const cached = cache.get<WasteCollection[]>(cacheKey);
	if (cached) return cached;

	const today = new Date();
	const end = new Date(today);
	end.setDate(end.getDate() + 30);

	const params = new URLSearchParams({
		zip: plz,
		start: fmt(today),
		end: fmt(end),
		offset: "0",
		limit: "50",
	});
	if (area) params.set("area", area);

	const res = await fetch(`${BASE}?${params}`);
	if (!res.ok) throw new Error(`OpenERZ: ${res.status}`);

	const data = (await res.json()) as OpenERZResponse;

	const collections: WasteCollection[] = data.result.map((e) => ({
		date: e.date,
		wasteType: e.waste_type as WasteTypeKey,
		area: e.area,
		region: e.region,
	}));

	// Sort by date
	collections.sort((a, b) => a.date.localeCompare(b.date));

	cache.set(cacheKey, collections, CACHE_TTL);
	return collections;
}

export function getNextCollection(collections: WasteCollection[]): WasteCollection | null {
	const today = fmt(new Date());
	return collections.find((c) => c.date >= today) ?? null;
}

export function getUpcomingByType(collections: WasteCollection[]): Map<string, WasteCollection> {
	const today = fmt(new Date());
	const map = new Map<string, WasteCollection>();
	for (const c of collections) {
		if (c.date >= today && !map.has(c.wasteType)) {
			map.set(c.wasteType, c);
		}
	}
	return map;
}

function fmt(d: Date): string {
	return d.toISOString().split("T")[0];
}
