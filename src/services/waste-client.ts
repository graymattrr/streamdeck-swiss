import type { WasteCollection, WasteTypeKey } from "../types/waste.js";
import { cache } from "./weather-cache.js";

const BASE = "https://openerz.metaodi.ch/api/calendar.json";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CUTOFF_HOUR = 15; // 3 PM — collections are done by this time

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

	return cache.getOrFetch(cacheKey, async () => {
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

		collections.sort((a, b) => a.date.localeCompare(b.date));
		return collections;
	}, CACHE_TTL);
}

export function getNextCollection(collections: WasteCollection[]): WasteCollection | null {
	const cutoff = effectiveToday();
	return collections.find((c) => c.date >= cutoff) ?? null;
}

export function getUpcomingByType(collections: WasteCollection[]): Map<string, WasteCollection> {
	const cutoff = effectiveToday();
	const map = new Map<string, WasteCollection>();
	for (const c of collections) {
		if (c.date >= cutoff && !map.has(c.wasteType)) {
			map.set(c.wasteType, c);
		}
	}
	return map;
}

export function getFollowingDayCollections(collections: WasteCollection[], dateStr: string): WasteCollection[] {
	const d = new Date(dateStr + "T00:00:00");
	d.setDate(d.getDate() + 1);
	return collections.filter((c) => c.date === fmt(d));
}

function effectiveToday(): string {
	const now = new Date();
	if (now.getHours() >= CUTOFF_HOUR) {
		now.setDate(now.getDate() + 1);
	}
	now.setHours(0, 0, 0, 0);
	return fmt(now);
}

function fmt(d: Date): string {
	return d.toISOString().split("T")[0];
}
