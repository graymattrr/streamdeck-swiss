#!/usr/bin/env node
// Rasterize individual tile SVGs to PNG for marketplace assets.
// Usage: node tools/render-tile.mjs
// Outputs PNGs under marketplace/ at 4x scale (576x576).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "marketplace");
mkdirSync(outDir, { recursive: true });

const W = 144;
const H = 144;
const BG_TOP = "#1a1a2e";
const BG_BOT = "#16213e";
const SCALE = 4; // 576x576 PNG

function svgWrap(content) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${BG_TOP}"/><stop offset="100%" stop-color="${BG_BOT}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)" rx="8"/>
${content}
</svg>`;
}

function pollenAllClear(stationName) {
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
	return svgWrap(`
		<rect x="0" y="0" width="${W}" height="34" rx="0" fill="#4A90E2" opacity="0.22"/>
		<text x="10" y="24" font-family="sans-serif" font-size="20" font-weight="bold" fill="#7FB3E8">Pollen</text>
		${cloud}
		<text x="${cx}" y="112" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#E2E8F0">All clear</text>
		${stationName ? `<text x="${cx}" y="130" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#718096">${stationName}</text>` : ""}
	`);
}

function render(name, svg) {
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: W * SCALE },
		font: { loadSystemFonts: true, defaultFontFamily: "Helvetica" },
	});
	const png = resvg.render().asPng();
	const out = resolve(outDir, `${name}.png`);
	writeFileSync(out, png);
	console.log(`wrote ${out} (${png.length} bytes)`);
}

render("pollen-all-clear", pollenAllClear("Zurich"));
render("pollen-all-clear-no-station", pollenAllClear());
