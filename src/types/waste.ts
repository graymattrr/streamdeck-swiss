import type { JsonObject } from "@elgato/utils";

export const WASTE_TYPES = {
	waste: { name: "Garbage", color: "#616161" },
	organic: { name: "Green", color: "#388E3C" },
	cardboard: { name: "Cardboard", color: "#8D6E63" },
	paper: { name: "Paper", color: "#1976D2" },
	incombustibles: { name: "Special", color: "#424242" },
	metal: { name: "Recycling", color: "#424242" },
	glass: { name: "Glass", color: "#00897B" },
	textile: { name: "Textiles", color: "#AD1457" },
	special: { name: "Special", color: "#424242" },
	eTram: { name: "E-Tram", color: "#F57C00" },
	cargotram: { name: "Cargo Tram", color: "#F57C00" },
} as const;

export type WasteTypeKey = keyof typeof WASTE_TYPES;

export type WasteCollection = {
	date: string;
	wasteType: WasteTypeKey;
	area: string;
	region: string;
};

export type WasteSettings = JsonObject & {
	plz: string;
	area: string;
};
