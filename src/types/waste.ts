import type { JsonObject } from "@elgato/utils";

export const WASTE_TYPES = {
	waste: { name: "Garbage", color: "#616161" },
	organic: { name: "Green", color: "#388E3C" },
	cardboard: { name: "Cardboard", color: "#8D6E63" },
	paper: { name: "Paper", color: "#1976D2" },
	incombustibles: { name: "Drop-off", color: "#424242" },
	metal: { name: "Recycling", color: "#424242" },
	glass: { name: "Glass", color: "#00897B" },
	textile: { name: "Textiles", color: "#AD1457" },
	special: { name: "Hazardous", color: "#424242" },
	eTram: { name: "E-Tram", color: "#F57C00" },
	cargotram: { name: "Cargo Tram", color: "#F57C00" },
	werecycle: { name: "WeRecycle", color: "#2E7D32" },
	chipping_service: { name: "Chipping", color: "#9CCD4A" },
	chipping_deadline: { name: "Sign-up", color: "#9CCD4A" },
	mobile: { name: "Mobile", color: "#4FC3F7" },
	oekibus: { name: "Ökibus", color: "#FF7043" },
	unknown: { name: "Unknown", color: "#9E9E9E" },
} as const;

export type WasteTypeKey = keyof typeof WASTE_TYPES;

export type WasteSource = "openerz" | "werecycle";

export type WasteCollection = {
	date: string;
	wasteType: WasteTypeKey;
	area: string;
	region: string;
	source?: WasteSource;
};

export type WeRecyclePlan = "off" | "one" | "two";

export type WasteSettings = JsonObject & {
	plz: string;
	area: string;
	weRecyclePlan?: WeRecyclePlan;
};
