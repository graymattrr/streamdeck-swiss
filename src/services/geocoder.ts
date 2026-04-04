import { findNearestStation } from "./station-registry.js";
import type { Station } from "../types/stations.js";

const GEOADMIN_URL = "https://api3.geo.admin.ch/rest/services/api/SearchServer";

type GeoAdminResult = {
	results: Array<{
		attrs: {
			lat: number;
			lon: number;
			label: string;
		};
	}>;
};

/**
 * Resolve a Swiss postal code (PLZ) to the nearest MeteoSwiss station.
 * Also returns the municipality name parsed from the geocoder label.
 */
export async function resolvePostalCode(plz: string): Promise<(Station & { municipality?: string; plzLat?: number; plzLon?: number }) | undefined> {
	const params = new URLSearchParams({
		searchText: plz,
		type: "locations",
		sr: "4326",
	});

	const res = await fetch(`${GEOADMIN_URL}?${params}`);
	if (!res.ok) return undefined;

	const data = (await res.json()) as GeoAdminResult;
	if (data.results.length === 0) return undefined;

	const { lat, lon, label } = data.results[0].attrs;
	const station = await findNearestStation(lat, lon);
	if (!station) return undefined;

	// Parse municipality from label like "<b>8135 - Langnau am Albis</b>"
	const match = label.replace(/<[^>]+>/g, "").match(/\d+\s*-\s*(.+)/);
	const municipality = match ? match[1].trim() : undefined;

	return { ...station, municipality, plzLat: lat, plzLon: lon };
}
