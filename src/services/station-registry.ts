import type { Station } from "../types/stations.js";

const TEMP_URL =
	"https://data.geo.admin.ch/ch.meteoschweiz.messwerte-lufttemperatur-10min/ch.meteoschweiz.messwerte-lufttemperatur-10min_en.json";

let stations: Station[] | null = null;
let stationMap: Map<string, Station> | null = null;

/**
 * Convert Swiss LV95 (EPSG:2056) coordinates to WGS84.
 * Approximate formulas from swisstopo.
 */
function lv95ToWgs84(east: number, north: number): { lat: number; lon: number } {
	const y = (east - 2_600_000) / 1_000_000;
	const x = (north - 1_200_000) / 1_000_000;

	const lonSec =
		2.6779094 +
		4.728982 * y +
		0.791484 * y * x +
		0.1306 * y * x * x -
		0.0436 * y * y * y;

	const latSec =
		16.9023892 +
		3.238272 * x -
		0.270978 * y * y -
		0.002528 * x * x -
		0.0447 * y * y * x -
		0.014 * x * x * x;

	return {
		lat: (latSec * 100) / 36,
		lon: (lonSec * 100) / 36,
	};
}

async function loadStations(): Promise<void> {
	const res = await fetch(TEMP_URL);
	if (!res.ok) throw new Error(`Failed to load stations: ${res.status}`);

	const data = await res.json();
	const features = data.features as Array<{
		id: string;
		geometry: { coordinates: [number, number] };
		properties: {
			station_name: string;
			altitude: number;
		};
	}>;

	const list: Station[] = [];
	const map = new Map<string, Station>();

	for (const f of features) {
		const [east, north] = f.geometry.coordinates;
		const { lat, lon } = lv95ToWgs84(east, north);
		const station: Station = {
			id: f.id,
			name: f.properties.station_name,
			altitude: f.properties.altitude,
			lat,
			lon,
		};
		list.push(station);
		map.set(station.id, station);
	}

	list.sort((a, b) => a.name.localeCompare(b.name));
	stations = list;
	stationMap = map;
}

export async function getStations(): Promise<Station[]> {
	if (!stations) await loadStations();
	return stations!;
}

export async function getStation(id: string): Promise<Station | undefined> {
	if (!stationMap) await loadStations();
	return stationMap!.get(id);
}

/**
 * Find the nearest station to given WGS84 coordinates using haversine distance.
 */
export async function findNearestStation(lat: number, lon: number): Promise<Station | undefined> {
	const all = await getStations();
	if (all.length === 0) return undefined;

	let nearest = all[0];
	let minDist = haversine(lat, lon, nearest.lat, nearest.lon);

	for (let i = 1; i < all.length; i++) {
		const d = haversine(lat, lon, all[i].lat, all[i].lon);
		if (d < minDist) {
			minDist = d;
			nearest = all[i];
		}
	}

	return nearest;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
