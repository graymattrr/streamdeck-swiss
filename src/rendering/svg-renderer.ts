import type { CurrentMeasurements, DayForecast } from "../types/weather.js";
import type { PollenReading, PollenTypeKey } from "../types/pollen.js";
import type { WasteCollection, WasteTypeKey } from "../types/waste.js";
import { POLLEN_TYPES, getPollenLevel, getPollenColor } from "../types/pollen.js";
import { WASTE_TYPES } from "../types/waste.js";
import { getWeatherInfo } from "./wmo-codes.js";
import { renderWeatherIcon } from "./weather-icons.js";
import { renderWasteIcon } from "./waste-icons.js";

const W = 144;
const H = 144;
const BG_TOP = "#1a1a2e";
const BG_BOT = "#16213e";

function svgWrap(content: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${BG_TOP}"/><stop offset="100%" stop-color="${BG_BOT}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>
${content}
</svg>`;
}

function tempStr(t: number | null): string {
	if (t === null) return "--";
	return `${Math.round(t)}°`;
}

/**
 * Today tile: weather icon (top), current temp (center), high/low (bottom).
 */
export function renderToday(
	measurements: CurrentMeasurements,
	weatherCode: number,
	dailyHigh: number,
	dailyLow: number,
): string {
	const info = getWeatherInfo(weatherCode);
	const icon = renderWeatherIcon(info.icon, W / 2, 36);

	const tempText = tempStr(measurements.temperature);
	const highLow = `${Math.round(dailyHigh)}° / ${Math.round(dailyLow)}°`;

	return svgWrap(`
		${icon}
		<text x="${W / 2}" y="95" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="bold" fill="#FFFFFF">${tempText}</text>
		<text x="${W / 2}" y="128" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#A0AEC0">${highLow}</text>
	`);
}

/**
 * Tomorrow tile: weather icon (top), high/low (center), day name (bottom).
 */
export function renderTomorrow(forecast: DayForecast): string {
	const info = getWeatherInfo(forecast.weatherCode);
	const icon = renderWeatherIcon(info.icon, W / 2, 34);

	const highLow = `${Math.round(forecast.tempMax)}° / ${Math.round(forecast.tempMin)}°`;
	const date = new Date(forecast.date + "T12:00:00");
	const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

	return svgWrap(`
		${icon}
		<text x="${W / 2}" y="90" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF">${highLow}</text>
		<text x="${W / 2}" y="124" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#A0AEC0">${dayName}</text>
	`);
}

/**
 * Forecast tile: 3 columns, each with day abbrev + icon + high temp.
 */
export function renderForecast(days: DayForecast[]): string {
	const count = Math.min(days.length, 2);
	const colW = W / count;

	let content = "";
	for (let i = 0; i < count; i++) {
		const day = days[i];
		const cx = colW * i + colW / 2;
		const date = new Date(day.date + "T12:00:00");
		const dayAbbrev = date.toLocaleDateString("en-US", { weekday: "short" });

		const info = getWeatherInfo(day.weatherCode);
		const icon = renderWeatherIcon(info.icon, cx, 52);

		content += `
			<text x="${cx}" y="24" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#A0AEC0">${dayAbbrev}</text>
			${icon}
			<text x="${cx}" y="104" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="bold" fill="#FFFFFF">${Math.round(day.tempMax)}°</text>
			<text x="${cx}" y="130" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#718096">${Math.round(day.tempMin)}°</text>
		`;
	}

	return svgWrap(content);
}

/**
 * Error state: warning icon + message.
 */
export function renderError(message: string): string {
	return svgWrap(`
		<text x="${W / 2}" y="60" text-anchor="middle" font-size="40">⚠</text>
		<text x="${W / 2}" y="95" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#E53E3E">${message}</text>
	`);
}

/**
 * Setup prompt when no station configured.
 */
export function renderSetup(): string {
	// Swiss cross proportions: arm width = S/5, arm length = 3S/5
	const S = 48; // red square size
	const cx = W / 2;
	const cy = 36; // center of red square (y=12 + S/2)
	const armW = Math.round(S / 5);     // 10
	const armL = Math.round(3 * S / 5); // 29
	return svgWrap(`
		<rect x="${cx - S / 2}" y="12" width="${S}" height="${S}" rx="8" fill="#D52B1E"/>
		<rect x="${cx - armW / 2}" y="${cy - armL / 2}" width="${armW}" height="${armL}" rx="2" fill="#FFFFFF"/>
		<rect x="${cx - armL / 2}" y="${cy - armW / 2}" width="${armL}" height="${armW}" rx="2" fill="#FFFFFF"/>
		<text x="${cx}" y="92" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">Swiss</text>
		<text x="${cx}" y="120" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">Deck</text>
	`);
}

/**
 * Pollen tile: only shows allergens above the "low" threshold.
 * When all clear, shows a green status indicator.
 */
export function renderPollen(reading: PollenReading, allergens: PollenTypeKey[], stationName?: string): string {
	const tracked = allergens.length > 0 ? allergens : (Object.keys(POLLEN_TYPES) as PollenTypeKey[]);

	// Filter to only those above "low" (count > 10)
	const elevated = tracked
		.filter((key) => reading.values[key] > 10)
		.sort((a, b) => reading.values[b] - reading.values[a]);

	// Overall status from tracked allergens
	let maxCount = 0;
	for (const key of tracked) {
		if (reading.values[key] > maxCount) maxCount = reading.values[key];
	}
	const overallLevel = getPollenLevel(maxCount);
	const overallColor = getPollenColor(overallLevel);

	if (elevated.length === 0) {
		// All clear — big green dot with checkmark
		return svgWrap(`
			<text x="${W / 2}" y="20" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#718096">Pollen</text>
			<circle cx="${W / 2}" cy="58" r="24" fill="${overallColor}" opacity="0.9"/>
			<path d="M${W / 2 - 10},${58} L${W / 2 - 3},${65} L${W / 2 + 12},${48}" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
			<text x="${W / 2}" y="108" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#A0AEC0">All clear</text>
			${stationName ? `<text x="${W / 2}" y="126" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#718096">${stationName}</text>` : ""}
		`);
	}

	// Show top 3 elevated allergens
	const count = Math.min(elevated.length, 3);

	// Header bar
	let content = `
		<rect x="0" y="0" width="${W}" height="34" rx="0" fill="${overallColor}" opacity="0.25"/>
		<text x="10" y="24" font-family="sans-serif" font-size="20" font-weight="bold" fill="${overallColor}">Pollen</text>
		<circle cx="${W - 18}" cy="17" r="8" fill="${overallColor}"/>
	`;

	if (count === 1) {
		// Single allergen — centered, large
		const key = elevated[0];
		const val = reading.values[key];
		const color = getPollenColor(getPollenLevel(val));
		const name = POLLEN_TYPES[key].name;
		content += `
			<text x="${W / 2}" y="78" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#FFFFFF">${name}</text>
			<text x="${W / 2}" y="118" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="${color}">${val}</text>
		`;
	} else if (count === 2) {
		// Two allergens — two rows, centered
		for (let i = 0; i < 2; i++) {
			const key = elevated[i];
			const val = reading.values[key];
			const color = getPollenColor(getPollenLevel(val));
			const name = POLLEN_TYPES[key].name;
			const y = 58 + i * 42;
			content += `
				<rect x="0" y="${y - 14}" width="6" height="36" rx="0" fill="${color}"/>
				<text x="16" y="${y + 6}" font-family="sans-serif" font-size="22" fill="#FFFFFF">${name}</text>
				<text x="${W - 10}" y="${y + 7}" text-anchor="end" font-family="sans-serif" font-size="26" font-weight="bold" fill="${color}">${val}</text>
			`;
		}
	} else {
		// Three allergens — compact rows
		for (let i = 0; i < 3; i++) {
			const key = elevated[i];
			const val = reading.values[key];
			const color = getPollenColor(getPollenLevel(val));
			const name = POLLEN_TYPES[key].name;
			const y = 52 + i * 32;
			content += `
				<rect x="0" y="${y - 10}" width="6" height="28" rx="0" fill="${color}"/>
				<text x="16" y="${y + 6}" font-family="sans-serif" font-size="20" fill="#FFFFFF">${name}</text>
				<text x="${W - 10}" y="${y + 7}" text-anchor="end" font-family="sans-serif" font-size="22" font-weight="bold" fill="${color}">${val}</text>
			`;
		}
	}

	// If more elevated but not shown
	if (elevated.length > 3) {
		content += `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#718096">+${elevated.length - 3} more</text>`;
	}

	return svgWrap(content);
}

/**
 * Waste tile: next collection with type icon, date, and countdown.
 */
export function renderWaste(next: WasteCollection | null, upcoming: Map<string, WasteCollection>, tomorrowTypes: WasteTypeKey[] = []): string {
	if (!next) {
		return svgWrap(`
			<text x="${W / 2}" y="70" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#A0AEC0">No pickups</text>
			<text x="${W / 2}" y="95" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#718096">scheduled</text>
		`);
	}

	const date = new Date(next.date + "T00:00:00");
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

	// Find all types on the same day as next
	const sameDayTypes = Array.from(upcoming.entries())
		.filter(([, c]) => c.date === next.date)
		.map(([t]) => t as WasteTypeKey);

	// Consecutive-day two-row layout: today + tomorrow
	if (tomorrowTypes.length > 0) {
		return svgWrap(renderWasteTwoRow(sameDayTypes, tomorrowTypes));
	}

	let dateLabel: string;
	let dateColor = "#A0AEC0";
	if (diffDays === 0) { dateLabel = "Today!"; dateColor = "#FF8A80"; }
	else if (diffDays === 1) { dateLabel = "Tomorrow"; dateColor = "#FFD180"; }
	else { dateLabel = date.toLocaleDateString("en-US", { weekday: "long" }); }

	const isEveBefore = diffDays === 1 || (diffDays === 0 && new Date().getHours() >= 18);
	const mainColor = WASTE_TYPES[sameDayTypes[0]] ?? WASTE_TYPES.waste;
	const urgencyColor = diffDays === 0 ? "#F44336" : isEveBefore ? "#FF9800" : mainColor.color;

	let content: string;

	if (sameDayTypes.length >= 2) {
		// Two colored icons side by side, no circles
		const info1 = WASTE_TYPES[sameDayTypes[0]] ?? WASTE_TYPES.waste;
		const info2 = WASTE_TYPES[sameDayTypes[1]] ?? WASTE_TYPES.waste;
		const icon1 = renderWasteIcon(sameDayTypes[0], W / 2 - 28, 30, info1.color, 1.4);
		const icon2 = renderWasteIcon(sameDayTypes[1], W / 2 + 28, 30, info2.color, 1.4);
		content = `
			${icon1}
			${icon2}
			<text x="${W / 2}" y="88" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">${info1.name} + ${info2.name}</text>
			<text x="${W / 2}" y="118" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="${diffDays <= 1 ? "bold" : "normal"}" fill="${dateColor}">${dateLabel}</text>
		`;
	} else {
		// Single colored icon centered, no circle
		const info = WASTE_TYPES[next.wasteType] ?? WASTE_TYPES.waste;
		const wasteIcon = renderWasteIcon(next.wasteType, W / 2, 30, info.color, 1.8);
		content = `
			${wasteIcon}
			<text x="${W / 2}" y="88" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF">${info.name}</text>
			<text x="${W / 2}" y="124" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="${diffDays <= 1 ? "bold" : "normal"}" fill="${dateColor}">${dateLabel}</text>
		`;
	}

	return svgWrap(content);
}

function renderWasteRow(types: WasteTypeKey[], iconY: number, labelY: number, nameY: number, dayLabel: string, dayColor: string): string {
	if (types.length >= 2) {
		const info1 = WASTE_TYPES[types[0]] ?? WASTE_TYPES.waste;
		const info2 = WASTE_TYPES[types[1]] ?? WASTE_TYPES.waste;
		const icon1 = renderWasteIcon(types[0], 18, iconY, info1.color, 0.85);
		const icon2 = renderWasteIcon(types[1], 38, iconY, info2.color, 0.85);
		return `
			${icon1}
			${icon2}
			<text x="58" y="${labelY}" font-family="sans-serif" font-size="20" font-weight="bold" fill="${dayColor}">${dayLabel}</text>
			<text x="58" y="${nameY}" font-family="sans-serif" font-size="12" fill="#A0AEC0">${info1.name} + ${info2.name}</text>
		`;
	}
	const info = WASTE_TYPES[types[0]] ?? WASTE_TYPES.waste;
	const icon = renderWasteIcon(types[0], 22, iconY, info.color, 1.0);
	return `
		${icon}
		<text x="46" y="${labelY}" font-family="sans-serif" font-size="22" font-weight="bold" fill="${dayColor}">${dayLabel}</text>
		<text x="46" y="${nameY}" font-family="sans-serif" font-size="20" fill="#FFFFFF">${info.name}</text>
	`;
}

function renderWasteTwoRow(todayTypes: WasteTypeKey[], tomorrowTypes: WasteTypeKey[]): string {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowLabel = tomorrow.toLocaleDateString("en-US", { weekday: "short" });
	const topRow = renderWasteRow(todayTypes, 36, 32, 54, "Today!", "#FF8A80");
	const separator = `<line x1="12" y1="72" x2="132" y2="72" stroke="#4A5568" stroke-width="1" opacity="0.4"/>`;
	const bottomRow = renderWasteRow(tomorrowTypes, 108, 104, 126, tomorrowLabel, "#FFD180");
	return `${topRow}${separator}${bottomRow}`;
}


/**
 * Encode SVG for setImage().
 */
export function encodeSvg(svg: string): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
