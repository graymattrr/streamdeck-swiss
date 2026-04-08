import type { JsonObject } from "@elgato/utils";

export type StationSettings = JsonObject & {
	stationId: string;
	stationName: string;
	stationLat: number;
	stationLon: number;
	plz: string;
};

export type TodaySettings = StationSettings;
export type TomorrowSettings = StationSettings;

export type ForecastSettings = StationSettings & {
	forecastDays: number;
};
