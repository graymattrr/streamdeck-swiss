/**
 * SVG weather icons using clean path-based shapes.
 * Designed for ~40x40px display area, positioned at (cx, cy) center.
 */

function sun(cx: number, cy: number, size: number = 20): string {
	const r = size * 0.35;
	const inner = r + 3;
	const outer = inner + size * 0.22;
	const rays = [0, 45, 90, 135, 180, 225, 270, 315]
		.map((a) => {
			const rad = (a * Math.PI) / 180;
			const x1 = cx + inner * Math.sin(rad);
			const y1 = cy - inner * Math.cos(rad);
			const x2 = cx + outer * Math.sin(rad);
			const y2 = cy - outer * Math.cos(rad);
			return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#FFD700" stroke-width="2.5" stroke-linecap="round"/>`;
		})
		.join("");
	return `<g>${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFD700"/></g>`;
}

function cloud(cx: number, cy: number, size: number = 24, color: string = "#D1D9E6"): string {
	// A proper cloud silhouette using a single path with arcs
	const s = size / 24; // scale factor
	const x = cx - 12 * s;
	const y = cy - 4 * s;
	return `<path d="M${x + 6 * s},${y + 10 * s}
		a${5 * s},${5 * s} 0 0,1 ${0},${-10 * s}
		a${7 * s},${7 * s} 0 0,1 ${12 * s},${-3 * s}
		a${5.5 * s},${5.5 * s} 0 0,1 ${8 * s},${5 * s}
		a${4 * s},${4 * s} 0 0,1 ${-1 * s},${8 * s}
		Z" fill="${color}"/>`;
}

function rainDrops(cx: number, cy: number, count: number = 3, heavy: boolean = false): string {
	const color = heavy ? "#2980D9" : "#5DADE2";
	const len = heavy ? 9 : 6;
	const w = heavy ? 2.2 : 1.8;
	const spacing = 9;
	const startX = cx - ((count - 1) * spacing) / 2;
	return Array.from({ length: count })
		.map((_, i) => {
			const dx = startX + i * spacing;
			return `<line x1="${dx}" y1="${cy}" x2="${dx - 2}" y2="${cy + len}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
		})
		.join("");
}

function snowflakes(cx: number, cy: number, count: number = 3): string {
	const spacing = 10;
	const startX = cx - ((count - 1) * spacing) / 2;
	return Array.from({ length: count })
		.map((_, i) => {
			const sx = startX + i * spacing;
			const sy = cy;
			const r = 3;
			// Six-pointed star from three crossing lines
			return `<g stroke="#E8EAF6" stroke-width="1.5" stroke-linecap="round">
				<line x1="${sx}" y1="${sy - r}" x2="${sx}" y2="${sy + r}"/>
				<line x1="${sx - r * 0.87}" y1="${sy - r * 0.5}" x2="${sx + r * 0.87}" y2="${sy + r * 0.5}"/>
				<line x1="${sx - r * 0.87}" y1="${sy + r * 0.5}" x2="${sx + r * 0.87}" y2="${sy - r * 0.5}"/>
			</g>`;
		})
		.join("");
}

function fogLines(cx: number, cy: number): string {
	const widths = [28, 22, 26];
	return widths
		.map(
			(w, i) =>
				`<line x1="${cx - w / 2}" y1="${cy + i * 8}" x2="${cx + w / 2}" y2="${cy + i * 8}" stroke="#90A4AE" stroke-width="3" stroke-linecap="round" opacity="${0.8 - i * 0.15}"/>`,
		)
		.join("");
}

function lightning(cx: number, cy: number): string {
	return `<path d="M${cx + 1},${cy} L${cx - 4},${cy + 8} L${cx},${cy + 8} L${cx - 2},${cy + 16} L${cx + 5},${cy + 6} L${cx + 1},${cy + 6} Z" fill="#FDD835" stroke="#F9A825" stroke-width="0.5"/>`;
}

export const WEATHER_ICONS: Record<string, (cx: number, cy: number) => string> = {
	clear: (cx, cy) => sun(cx, cy),
	"mostly-clear": (cx, cy) => sun(cx - 6, cy - 3, 16) + cloud(cx + 5, cy + 5, 18),
	"partly-cloudy": (cx, cy) => sun(cx - 5, cy - 5, 14) + cloud(cx + 3, cy + 3, 22),
	overcast: (cx, cy) => cloud(cx - 3, cy + 2, 20, "#90A4AE") + cloud(cx + 3, cy - 2, 26, "#B0BEC5"),
	fog: (cx, cy) => fogLines(cx, cy),
	drizzle: (cx, cy) => cloud(cx, cy - 5, 22) + rainDrops(cx, cy + 8, 2),
	rain: (cx, cy) => cloud(cx, cy - 6, 24) + rainDrops(cx, cy + 8, 3),
	"heavy-rain": (cx, cy) => cloud(cx, cy - 6, 24, "#90A4AE") + rainDrops(cx, cy + 8, 4, true),
	snow: (cx, cy) => cloud(cx, cy - 6, 24) + snowflakes(cx, cy + 10, 3),
	"heavy-snow": (cx, cy) => cloud(cx, cy - 6, 24, "#90A4AE") + snowflakes(cx, cy + 10, 4),
	thunderstorm: (cx, cy) =>
		cloud(cx, cy - 8, 26, "#78909C") + lightning(cx, cy + 4) + rainDrops(cx, cy + 16, 2, true),
};

export function renderWeatherIcon(iconKey: string, cx: number, cy: number): string {
	const renderer = WEATHER_ICONS[iconKey] ?? WEATHER_ICONS["overcast"];
	return renderer(cx, cy);
}
