import type { PollenReading, PollenTypeKey } from "../types/pollen.js";
import { cache } from "./weather-cache.js";

const STAC_ITEMS = "https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-pollen/items";
const BASE = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-pollen";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (data is hourly)

const POLLEN_COLUMNS: PollenTypeKey[] = [
	"kabetuh0", "khpoach0", "kaalnuh0", "kacoryh0", "kafaguh0", "kafraxh0", "kaquerh0",
];

export type PollenStation = {
	id: string;
	name: string;
	lat: number;
	lon: number;
};

let pollenStations: PollenStation[] | null = null;

export async function getPollenStations(): Promise<PollenStation[]> {
	if (pollenStations) return pollenStations;

	const res = await fetch(`${STAC_ITEMS}?limit=30`);
	if (!res.ok) throw new Error(`Pollen stations: ${res.status}`);

	const data = await res.json();
	pollenStations = data.features.map((f: { id: string; properties: { title: string }; geometry: { coordinates: [number, number] } }) => ({
		id: f.id,
		name: f.properties.title,
		lat: f.geometry.coordinates[1],
		lon: f.geometry.coordinates[0],
	}));

	pollenStations!.sort((a, b) => a.name.localeCompare(b.name));
	return pollenStations!;
}

export function findNearestPollenStation(lat: number, lon: number, stations: PollenStation[]): PollenStation | undefined {
	if (stations.length === 0) return undefined;
	let nearest = stations[0];
	let minDist = Math.hypot(lat - nearest.lat, lon - nearest.lon);
	for (let i = 1; i < stations.length; i++) {
		const d = Math.hypot(lat - stations[i].lat, lon - stations[i].lon);
		if (d < minDist) { minDist = d; nearest = stations[i]; }
	}
	return nearest;
}

export async function fetchPollenData(stationId: string): Promise<PollenReading | null> {
	const cacheKey = `pollen:${stationId}`;
	const cached = cache.get<PollenReading>(cacheKey);
	if (cached) return cached;

	const url = `${BASE}/${stationId}/ogd-pollen_${stationId}_h_recent.csv`;
	const res = await fetch(url);
	if (!res.ok) return null;

	const text = await res.text();
	const lines = text.trim().split("\n");
	if (lines.length < 2) return null;

	const headers = lines[0].split(";");
	const lastLine = lines[lines.length - 1].split(";");

	const values = {} as Record<PollenTypeKey, number>;
	for (const col of POLLEN_COLUMNS) {
		const idx = headers.indexOf(col);
		values[col] = idx >= 0 ? (parseFloat(lastLine[idx]) || 0) : 0;
	}

	const timestampIdx = headers.indexOf("reference_timestamp");
	const timestamp = timestampIdx >= 0 ? lastLine[timestampIdx] : "";

	const reading: PollenReading = { timestamp, values };
	cache.set(cacheKey, reading, CACHE_TTL);
	return reading;
}
