// Update marketplace PNGs in place: replace the old green-checkmark pollen
// all-clear tile with the new soft-clouds visual in both gallery-2-pollen.png
// and thumbnail.png. Tile bounds were discovered by analyze-tiles.mjs.

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const marketDir = resolve(__dirname, "..", "marketplace");

const W = 144;
const H = 144;
const BG_TOP = "#1a1a2e";
const BG_BOT = "#16213e";

function svgWrap(content) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${BG_TOP}"/><stop offset="100%" stop-color="${BG_BOT}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>
${content}
</svg>`;
}

function pollenAllClear({ stationName, showHeader = true } = {}) {
	const cx = W / 2;
	const cloud = `
		<g fill="#FFFFFF" opacity="0.92">
			<ellipse cx="${cx - 14}" cy="60" rx="18" ry="12"/>
			<ellipse cx="${cx + 6}" cy="55" rx="14" ry="11"/>
			<ellipse cx="${cx + 20}" cy="62" rx="13" ry="10"/>
			<rect x="${cx - 30}" y="60" width="56" height="14" rx="7"/>
		</g>
		<g fill="#E3F2FD" opacity="0.85">
			<ellipse cx="${cx + 24}" cy="82" rx="12" ry="8"/>
			<ellipse cx="${cx + 36}" cy="84" rx="9" ry="7"/>
			<rect x="${cx + 16}" y="82" width="26" height="10" rx="5"/>
		</g>
	`;
	const header = showHeader
		? `<rect x="0" y="0" width="${W}" height="34" rx="0" fill="#4A90E2" opacity="0.22"/>
		   <text x="10" y="24" font-family="sans-serif" font-size="20" font-weight="bold" fill="#7FB3E8">Pollen</text>`
		: "";
	return svgWrap(`
		${header}
		${cloud}
		<text x="${cx}" y="112" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#E2E8F0">All clear</text>
		${stationName ? `<text x="${cx}" y="130" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#718096">${stationName}</text>` : ""}
	`);
}

async function svgToPng(svg, targetWidth) {
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: targetWidth },
		font: { loadSystemFonts: true, defaultFontFamily: "Helvetica" },
	});
	return resvg.render().asPng();
}

async function composite(file, tilePng, left, top, width, height) {
	const path = resolve(marketDir, file);
	// Resize the tile PNG to exactly the target box. (svgToPng already produced
	// the right width; enforce both dims in case of rounding.)
	const resized = await sharp(tilePng).resize(width, height, { fit: "fill" }).png().toBuffer();
	const out = await sharp(path)
		.composite([{ input: resized, left, top }])
		.png()
		.toBuffer();
	await sharp(out).toFile(path);
	console.log(`updated ${file} at (${left},${top}) ${width}x${height}`);
}

// --- gallery-2-pollen.png ---
// Three tiles at y 270..569. All-clear is rightmost: x 1210..1509.
// Box = 300x300. The tile rendering will show the station-name footer.
{
	const svg = pollenAllClear({ stationName: "Zurich", showHeader: true });
	const png = await svgToPng(svg, 300);
	await composite("gallery-2-pollen.png", png, 1210, 270, 300, 300);
}

// --- thumbnail.png ---
// 5x2 grid. All-clear is column 4 (0-indexed 3), row 2.
// x 1062..1241, y 660..839. Box = 180x180.
// Original mockup omitted the station footer, so match that.
{
	const svg = pollenAllClear({ stationName: "", showHeader: true });
	const png = await svgToPng(svg, 180);
	await composite("thumbnail.png", png, 1062, 660, 180, 180);
}
