import type { CurrentMeasurements } from "../types/weather.js";
import { cache } from "./weather-cache.js";

const BASE = "https://data.geo.admin.ch";
const ENDPOINTS = {
	temperature: "ch.meteoschweiz.messwerte-lufttemperatur-10min",
	precipitation: "ch.meteoschweiz.messwerte-niederschlag-10min",
	wind: "ch.meteoschweiz.messwerte-windgeschwindigkeit-kmh-10min",
	humidity: "ch.meteoschweiz.messwerte-luftfeuchtigkeit-10min",
} as const;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

type GeoJsonFeature = {
	id: string;
	properties: {
		station_name: string;
		value: number | null;
		reference_ts: string;
	};
};

type GeoJsonResponse = {
	features: GeoJsonFeature[];
};

async function fetchEndpoint(dataset: string): Promise<GeoJsonResponse> {
	const cacheKey = `meteoswiss:${dataset}`;
	const cached = cache.get<GeoJsonResponse>(cacheKey);
	if (cached) return cached;

	const url = `${BASE}/${dataset}/${dataset}_en.json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`MeteoSwiss ${dataset}: ${res.status}`);

	const data = (await res.json()) as GeoJsonResponse;
	cache.set(cacheKey, data, CACHE_TTL);
	return data;
}

function findStation(data: GeoJsonResponse, stationId: string): GeoJsonFeature | undefined {
	return data.features.find((f) => f.id === stationId);
}

export async function fetchCurrentWeather(stationId: string): Promise<CurrentMeasurements> {
	const [tempResult, precipResult, windResult, humidityResult] = await Promise.allSettled([
		fetchEndpoint(ENDPOINTS.temperature),
		fetchEndpoint(ENDPOINTS.precipitation),
		fetchEndpoint(ENDPOINTS.wind),
		fetchEndpoint(ENDPOINTS.humidity),
	]);

	const tempFeature =
		tempResult.status === "fulfilled" ? findStation(tempResult.value, stationId) : undefined;
	const precipFeature =
		precipResult.status === "fulfilled"
			? findStation(precipResult.value, stationId)
			: undefined;
	const windFeature =
		windResult.status === "fulfilled" ? findStation(windResult.value, stationId) : undefined;
	const humidityFeature =
		humidityResult.status === "fulfilled"
			? findStation(humidityResult.value, stationId)
			: undefined;

	return {
		stationId,
		stationName: tempFeature?.properties.station_name ?? stationId,
		temperature: tempFeature?.properties.value ?? null,
		precipitation: precipFeature?.properties.value ?? null,
		windSpeed: windFeature?.properties.value ?? null,
		humidity: humidityFeature?.properties.value ?? null,
		timestamp: tempFeature?.properties.reference_ts ?? new Date().toISOString(),
	};
}
