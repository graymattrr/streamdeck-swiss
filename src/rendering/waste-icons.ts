/**
 * SVG icons matching official Swiss waste collection symbols.
 * Colored shapes rendered directly on dark backgrounds.
 */

let F = "#FFFFFF";

// Garbage: simple bin — rectangle body with lid bar on top
function garbageBag(cx: number, cy: number): string {
	return `<g fill="${F}">
		<rect x="${cx - 8}" y="${cy - 4}" width="16" height="16" rx="2"/>
		<rect x="${cx - 10}" y="${cy - 7}" width="20" height="4" rx="2"/>
		<rect x="${cx - 3}" y="${cy - 11}" width="6" height="5" rx="2"/>
	</g>`;
}

// Green waste: leaf shape — simple pointed oval with center vein
function greenTree(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="M${cx},${cy - 12} Q${cx + 12},${cy} ${cx},${cy + 12} Q${cx - 12},${cy} ${cx},${cy - 12} Z"/>
		<line x1="${cx}" y1="${cy - 8}" x2="${cx}" y2="${cy + 8}" stroke="#1a1a2e" stroke-width="1.5" opacity="0.4"/>
	</g>`;
}

// Cardboard: open box seen from front — box body with two open flaps
function cardboardBox(cx: number, cy: number): string {
	return `<g fill="${F}">
		<rect x="${cx - 10}" y="${cy - 2}" width="20" height="14" rx="1.5"/>
		<path d="M${cx - 10},${cy - 2} L${cx - 8},${cy - 8} L${cx - 2},${cy - 8} L${cx - 2},${cy - 2}" fill="${F}"/>
		<path d="M${cx + 10},${cy - 2} L${cx + 8},${cy - 8} L${cx + 2},${cy - 8} L${cx + 2},${cy - 2}" fill="${F}"/>
	</g>`;
}

// Paper: stack of horizontal sheets with slight offset
function paperStack(cx: number, cy: number): string {
	return `<g fill="${F}">
		<rect x="${cx - 9}" y="${cy - 9}" width="17" height="5" rx="1" transform="rotate(-3 ${cx} ${cy - 7})"/>
		<rect x="${cx - 8}" y="${cy - 3}" width="17" height="5" rx="1" transform="rotate(2 ${cx} ${cy})"/>
		<rect x="${cx - 9}" y="${cy + 3}" width="17" height="5" rx="1" transform="rotate(-1 ${cx} ${cy + 5})"/>
	</g>`;
}

// Glass: bottle silhouette — narrow neck, wide body
function bottle(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="
			M${cx - 2},${cy - 13}
			L${cx + 2},${cy - 13}
			L${cx + 2},${cy - 7}
			L${cx + 7},${cy - 1}
			L${cx + 7},${cy + 11}
			Q${cx + 7},${cy + 13} ${cx + 5},${cy + 13}
			L${cx - 5},${cy + 13}
			Q${cx - 7},${cy + 13} ${cx - 7},${cy + 11}
			L${cx - 7},${cy - 1}
			L${cx - 2},${cy - 7}
			Z
		"/>
	</g>`;
}

// Textile: T-shirt shape
function shirt(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="
			M${cx - 4},${cy - 11}
			L${cx - 12},${cy - 7}
			L${cx - 9},${cy - 1}
			L${cx - 6},${cy - 4}
			L${cx - 6},${cy + 12}
			L${cx + 6},${cy + 12}
			L${cx + 6},${cy - 4}
			L${cx + 9},${cy - 1}
			L${cx + 12},${cy - 7}
			L${cx + 4},${cy - 11}
			Q${cx},${cy - 6} ${cx - 4},${cy - 11}
			Z
		"/>
	</g>`;
}

// Special waste: circle with bold S
function specialS(cx: number, cy: number): string {
	return `<g>
		<circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${F}" stroke-width="2.5"/>
		<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="${F}">S</text>
	</g>`;
}

// Recycling: circle with bold W
function recyclingW(cx: number, cy: number): string {
	return `<g>
		<circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${F}" stroke-width="2.5"/>
		<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="${F}">W</text>
	</g>`;
}

// E-Tram / Cargo Tram: lightning bolt
function lightning(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="M${cx + 2},${cy - 12} L${cx - 7},${cy + 1} L${cx - 1},${cy + 1} L${cx - 3},${cy + 12} L${cx + 7},${cy - 1} L${cx + 1},${cy - 1} Z"/>
	</g>`;
}

// WeRecycle: bag silhouette with handle (matches their green-bag branding)
function recyclingBag(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="
			M${cx - 9},${cy - 4}
			L${cx + 9},${cy - 4}
			L${cx + 11},${cy + 12}
			Q${cx + 11},${cy + 13} ${cx + 10},${cy + 13}
			L${cx - 10},${cy + 13}
			Q${cx - 11},${cy + 13} ${cx - 11},${cy + 12}
			Z
		"/>
		<path d="M${cx - 5},${cy - 4} Q${cx - 5},${cy - 11} ${cx},${cy - 11} Q${cx + 5},${cy - 11} ${cx + 5},${cy - 4}" fill="none" stroke="${F}" stroke-width="2"/>
		<text x="${cx}" y="${cy + 9}" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1a1a2e">♻</text>
	</g>`;
}

// Chipping service: sprig with three leaves on a central stem (Häckseldienst)
function leafySprig(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="M${cx - 2},${cy + 13} Q${cx},${cy} ${cx + 2},${cy - 13} L${cx + 2},${cy - 13} Q${cx - 1},${cy} ${cx - 2},${cy + 13} Z"/>
		<path d="M${cx + 1},${cy - 8} Q${cx + 11},${cy - 11} ${cx + 11},${cy - 2} Q${cx + 4},${cy - 3} ${cx + 1},${cy - 8} Z"/>
		<path d="M${cx - 1},${cy - 1} Q${cx - 11},${cy - 4} ${cx - 11},${cy + 5} Q${cx - 4},${cy + 4} ${cx - 1},${cy - 1} Z"/>
		<path d="M${cx + 1},${cy + 6} Q${cx + 10},${cy + 3} ${cx + 10},${cy + 12} Q${cx + 4},${cy + 11} ${cx + 1},${cy + 6} Z"/>
	</g>`;
}

// Mobile recycling station: truck silhouette (Mobile-Recyclinghof)
function truck(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="M${cx - 12},${cy - 6} L${cx + 3},${cy - 6} L${cx + 3},${cy - 2} L${cx + 9},${cy - 2} L${cx + 12},${cy + 2} L${cx + 12},${cy + 5} L${cx - 12},${cy + 5} Z"/>
		<circle cx="${cx - 7}" cy="${cy + 8}" r="2.8"/>
		<circle cx="${cx + 8}" cy="${cy + 8}" r="2.8"/>
	</g>`;
}

// Ökibus: hazardous-waste mobile — truck with warning triangle
function hazardTruck(cx: number, cy: number): string {
	return `<g fill="${F}">
		<path d="M${cx - 11},${cy - 1} L${cx + 3},${cy - 1} L${cx + 3},${cy + 2} L${cx + 8},${cy + 2} L${cx + 11},${cy + 5} L${cx + 11},${cy + 8} L${cx - 11},${cy + 8} Z"/>
		<circle cx="${cx - 6}" cy="${cy + 10}" r="2.3"/>
		<circle cx="${cx + 7}" cy="${cy + 10}" r="2.3"/>
		<path d="M${cx},${cy - 13} L${cx - 7},${cy - 3} L${cx + 7},${cy - 3} Z" fill="none" stroke="${F}" stroke-width="2"/>
		<text x="${cx}" y="${cy - 5}" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="${F}">!</text>
	</g>`;
}

// Unknown / fallback: circle with question mark
function questionCircle(cx: number, cy: number): string {
	return `<g>
		<circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${F}" stroke-width="2.5"/>
		<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="${F}">?</text>
	</g>`;
}

// Warning triangle
function warning(cx: number, cy: number): string {
	return `<g>
		<path d="M${cx},${cy - 11} L${cx - 12},${cy + 10} L${cx + 12},${cy + 10} Z" fill="none" stroke="${F}" stroke-width="2.5" stroke-linejoin="round"/>
		<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="${F}">!</text>
	</g>`;
}

export const WASTE_ICONS: Record<string, (cx: number, cy: number) => string> = {
	waste: garbageBag,
	organic: greenTree,
	cardboard: cardboardBox,
	paper: paperStack,
	glass: bottle,
	textile: shirt,
	incombustibles: specialS,
	metal: recyclingW,
	special: warning,
	eTram: lightning,
	cargotram: lightning,
	werecycle: recyclingBag,
	chipping_service: leafySprig,
	mobile: truck,
	oekibus: hazardTruck,
	unknown: questionCircle,
};

export function renderWasteIcon(type: string, cx: number, cy: number, color?: string, scale: number = 1): string {
	if (color) F = color;
	const renderer = WASTE_ICONS[type] ?? WASTE_ICONS["unknown"];
	const raw = renderer(cx, cy);
	F = "#FFFFFF";
	if (scale === 1) return raw;
	return `<g transform="translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})">${raw}</g>`;
}
