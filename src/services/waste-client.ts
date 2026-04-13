import type { WasteCollection, WasteTypeKey, WeRecyclePlan } from "../types/waste.js";
import { cache } from "./weather-cache.js";

const BASE = "https://openerz.metaodi.ch/api/calendar.json";
const WERECYCLE_BASE = "https://www.werecycle.ch/wp-content/plugins/zpt-region-pickup-dates/includes/ajax.php";
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
			source: "openerz",
		}));

		collections.sort((a, b) => a.date.localeCompare(b.date));
		return collections;
	}, CACHE_TTL);
}

type WeRecycleEntry = {
	zip: string;
	dates: { date1: string; date2: string };
	pickup: "one" | "two";
};

type WeRecycleResponse = {
	type: "success" | string;
	msg?: WeRecycleEntry[];
};

const MONTHS: Record<string, number> = {
	jan: 0, january: 0, januar: 0,
	feb: 1, february: 1, februar: 1,
	mar: 2, march: 2, mär: 2, maerz: 2, märz: 2,
	apr: 3, april: 3,
	may: 4, mai: 4,
	jun: 5, june: 5, juni: 5,
	jul: 6, july: 6, juli: 6,
	aug: 7, august: 7,
	sep: 8, sept: 8, september: 8,
	oct: 9, october: 9, okt: 9, oktober: 9,
	nov: 10, november: 10,
	dec: 11, december: 11, dez: 11, dezember: 11,
};

function parseWeRecycleDate(s: string): string | null {
	const trimmed = s.trim();
	if (!trimmed) return null;
	// Format: "16. Apr 2026" (EN) or "16. Mai 2026" (DE)
	const m = trimmed.match(/^(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\.?\s+(\d{4})$/);
	if (!m) return null;
	const day = parseInt(m[1], 10);
	const monthIdx = MONTHS[m[2].toLowerCase()];
	const year = parseInt(m[3], 10);
	if (monthIdx === undefined || isNaN(day) || isNaN(year)) return null;
	const mm = String(monthIdx + 1).padStart(2, "0");
	const dd = String(day).padStart(2, "0");
	return `${year}-${mm}-${dd}`;
}

export async function fetchWeRecyclePickup(plz: string, plan: "one" | "two"): Promise<WasteCollection | null> {
	const cacheKey = `waste:werecycle:${plz}:${plan}`;
	try {
		return await cache.getOrFetch(cacheKey, async () => {
			const body = new URLSearchParams({ zpt_get_zip_code_data: "true", data: plz }).toString();
			const res = await fetch(WERECYCLE_BASE, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"X-Requested-With": "XMLHttpRequest",
					"Referer": "https://www.werecycle.ch/en/abholdaten/",
				},
				body,
			});
			if (!res.ok) throw new Error(`WeRecycle: ${res.status}`);

			const data = (await res.json()) as WeRecycleResponse;
			if (data.type !== "success" || !Array.isArray(data.msg)) return null;

			const entry = data.msg.find((e) => e.zip === plz && e.pickup === plan);
			if (!entry) return null;

			const next = parseWeRecycleDate(entry.dates.date1) ?? parseWeRecycleDate(entry.dates.date2);
			if (!next) return null;

			return {
				date: next,
				wasteType: "werecycle" as WasteTypeKey,
				area: "",
				region: "",
				source: "werecycle",
			};
		}, CACHE_TTL);
	} catch {
		return null;
	}
}

export async function fetchAllPickups(plz: string, area?: string, weRecyclePlan?: WeRecyclePlan): Promise<WasteCollection[]> {
	const cached = await fetchWasteSchedule(plz, area);
	if (!weRecyclePlan || weRecyclePlan === "off") return cached;

	const wr = await fetchWeRecyclePickup(plz, weRecyclePlan);
	if (!wr) return cached;

	// Copy to avoid mutating the cached OpenERZ array.
	const merged = [...cached, wr];
	merged.sort((a, b) => a.date.localeCompare(b.date));
	return merged;
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
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
