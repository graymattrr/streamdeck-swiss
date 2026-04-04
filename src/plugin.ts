import streamDeck from "@elgato/streamdeck";

import { TodayAction } from "./actions/today.js";
import { TomorrowAction } from "./actions/tomorrow.js";
import { ForecastAction } from "./actions/forecast.js";
import { PollenAction } from "./actions/pollen.js";
import { WasteAction } from "./actions/waste.js";
import { getStations, getStation } from "./services/station-registry.js";
import { getPollenStations, findNearestPollenStation } from "./services/pollen-client.js";
import { resolvePostalCode } from "./services/geocoder.js";

streamDeck.actions.registerAction(new TodayAction());
streamDeck.actions.registerAction(new TomorrowAction());
streamDeck.actions.registerAction(new ForecastAction());
streamDeck.actions.registerAction(new PollenAction());
streamDeck.actions.registerAction(new WasteAction());

// Global PI message handler (official pattern: streamDeck.ui.current?.sendToPropertyInspector)
streamDeck.ui.onSendToPlugin(async (ev) => {
	const payload = ev.payload as Record<string, unknown>;
	const reply = (data: Record<string, unknown>) => {
		streamDeck.ui.current?.sendToPropertyInspector(data);
	};

	try {
		if (payload.event === "getStations") {
			const stations = await getStations();
			reply({ event: "getStations", items: groupByLetter(stations) });
		}

		if (payload.event === "resolvePLZ") {
			const station = await resolvePostalCode(payload.plz as string);
			reply({ event: "plzResolved", station: station ?? null });
		}

		if (payload.event === "resolveStation") {
			const station = await getStation(payload.stationId as string);
			reply({ event: "stationResolved", station: station ?? null });
		}

		if (payload.event === "getPollenStations") {
			const stations = await getPollenStations();
			reply({ event: "pollenStations", items: stations.map((s) => ({ label: s.name, value: s.id })) });
		}

		if (payload.event === "resolvePLZPollen") {
			const weatherStation = await resolvePostalCode(payload.plz as string);
			if (weatherStation) {
				const all = await getPollenStations();
				const nearest = findNearestPollenStation(weatherStation.lat, weatherStation.lon, all);
				reply({ event: "plzResolved", station: nearest ?? null });
			} else {
				reply({ event: "plzResolved", station: null });
			}
		}
	} catch (err) {
		streamDeck.logger.error(`PI handler error: ${err}`);
	}
});

streamDeck.connect();

function groupByLetter(
	stations: Array<{ id: string; name: string; altitude: number }>,
): Array<{ label: string; children: Array<{ label: string; value: string }> }> {
	const groups = new Map<string, Array<{ label: string; value: string }>>();
	for (const s of stations) {
		const letter = s.name.charAt(0).toUpperCase();
		if (!groups.has(letter)) groups.set(letter, []);
		groups.get(letter)!.push({ label: `${s.name} (${s.altitude}m)`, value: s.id });
	}
	return Array.from(groups.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([letter, children]) => ({ label: letter, children }));
}
