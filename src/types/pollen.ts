import type { JsonObject } from "@elgato/streamdeck";
import type { StationSettings } from "./settings.js";

export const POLLEN_TYPES = {
	kabetuh0: { name: "Birch", latin: "Betula" },
	khpoach0: { name: "Grasses", latin: "Poaceae" },
	kaalnuh0: { name: "Alder", latin: "Alnus" },
	kacoryh0: { name: "Hazel", latin: "Corylus" },
	kafaguh0: { name: "Beech", latin: "Fagus" },
	kafraxh0: { name: "Ash", latin: "Fraxinus" },
	kaquerh0: { name: "Oak", latin: "Quercus" },
} as const;

export type PollenTypeKey = keyof typeof POLLEN_TYPES;

export type PollenReading = {
	timestamp: string;
	values: Record<PollenTypeKey, number>;
};

export type PollenSettings = JsonObject & {
	pollenStationId: string;
	pollenStationName: string;
	allergens: PollenTypeKey[];
	plz: string;
};

export type PollenLevel = "none" | "low" | "moderate" | "high" | "very-high";

export function getPollenLevel(count: number): PollenLevel {
	if (count <= 0) return "none";
	if (count <= 10) return "low";
	if (count <= 50) return "moderate";
	if (count <= 100) return "high";
	return "very-high";
}

export function getPollenColor(level: PollenLevel): string {
	switch (level) {
		case "none": return "#4CAF50";
		case "low": return "#FFEB3B";
		case "moderate": return "#FF9800";
		case "high": return "#F44336";
		case "very-high": return "#9C27B0";
	}
}
