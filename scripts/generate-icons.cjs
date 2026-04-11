#!/usr/bin/env node
/**
 * Generate all Stream Deck plugin icons (white on transparent).
 *
 * Category icon — Swiss cross with official proportions:
 *   arm width:length = 6:7, total cross = 5/8 of icon
 *
 * Action icons — white monochromatic, 20x20 (@1x) and 40x40 (@2x)
 *
 * Uses macOS `sips` to convert SVG → PNG.
 *
 * Usage: node scripts/generate-icons.cjs
 */

const { writeFileSync, unlinkSync, mkdirSync } = require("fs");
const { execSync } = require("child_process");
const { join } = require("path");

const PLUGIN_DIR = join(__dirname, "..", "ch.swissdeck.plugin.sdPlugin");
const IMG_DIR = join(PLUGIN_DIR, "imgs");

// ---------------------------------------------------------------------------
// SVG generators — all produce white (#FFFFFF) on transparent
// ---------------------------------------------------------------------------

function swissCrossSvg(S) {
	// Official Swiss cross: arm ratio 7:6, total cross height = 5/8 of S
	const H = (5 * S) / 8;
	const W = (3 * H) / 10;
	const cx = S / 2;
	const cy = S / 2;
	const rx = Math.max(0.5, S / 37);

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect x="${cx - W / 2}" y="${cy - H / 2}" width="${W}" height="${H}" rx="${rx}" fill="#FFFFFF"/>
<rect x="${cx - H / 2}" y="${cy - W / 2}" width="${H}" height="${W}" rx="${rx}" fill="#FFFFFF"/>
</svg>`;
}

function sunSvg(S) {
	// Scale factor from 20x20 base
	const f = S / 20;
	const sw = 1.5 * f;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 20 20">
<circle cx="10" cy="10" r="4" fill="none" stroke="#FFF" stroke-width="${sw}"/>
<line x1="10" y1="1.5" x2="10" y2="4" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="10" y1="16" x2="10" y2="18.5" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="1.5" y1="10" x2="4" y2="10" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="16" y1="10" x2="18.5" y2="10" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="4" y1="4" x2="5.8" y2="5.8" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="14.2" y1="14.2" x2="16" y2="16" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="16" y1="4" x2="14.2" y2="5.8" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
<line x1="5.8" y1="14.2" x2="4" y2="16" stroke="#FFF" stroke-width="${sw}" stroke-linecap="round"/>
</svg>`;
}

function cloudSvg(S) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 20 20">
<path d="M5.5 14.5h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 5.5 9a3.5 3.5 0 0 0 0 5.5z"
      fill="none" stroke="#FFF" stroke-width="1.3" stroke-linejoin="round"/>
</svg>`;
}

function forecastSvg(S) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 20 20">
<!-- Column 1: sun -->
<circle cx="5" cy="8.5" r="1.6" fill="none" stroke="#FFF" stroke-width="1"/>
<line x1="5" y1="5.5" x2="5" y2="6.2" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="5" y1="10.8" x2="5" y2="11.5" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="2" y1="8.5" x2="2.7" y2="8.5" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="7.3" y1="8.5" x2="8" y2="8.5" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="2.9" y1="6.4" x2="3.4" y2="6.9" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="6.6" y1="10.1" x2="7.1" y2="10.6" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="7.1" y1="6.4" x2="6.6" y2="6.9" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<line x1="3.4" y1="10.1" x2="2.9" y2="10.6" stroke="#FFF" stroke-width="0.9" stroke-linecap="round"/>
<text x="5" y="15" text-anchor="middle" font-family="sans-serif" font-size="2.8" font-weight="bold" fill="#FFF">18°</text>
<text x="5" y="18" text-anchor="middle" font-family="sans-serif" font-size="2.2" fill="#FFF" opacity="0.5">9°</text>
<!-- Column 2: cloud -->
<path d="M12.8 11h4a2 2 0 0 0 .2-3.97A2.6 2.6 0 0 0 12.8 8.3a2 2 0 0 0 0 2.7z"
      fill="none" stroke="#FFF" stroke-width="1" stroke-linejoin="round"/>
<text x="15" y="15" text-anchor="middle" font-family="sans-serif" font-size="2.8" font-weight="bold" fill="#FFF">14°</text>
<text x="15" y="18" text-anchor="middle" font-family="sans-serif" font-size="2.2" fill="#FFF" opacity="0.5">7°</text>
</svg>`;
}

function pollenSvg(S) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 20 20">
<!-- edelweiss centered at 7.5, 9 -->
<!-- layer 1: 5 wide leaf-shaped petals -->
<path d="M7.5 9 C9.2 7.5 9.2 5 7.5 3 C5.8 5 5.8 7.5 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8"/>
<path d="M7.5 9 C9.2 7.5 9.2 5 7.5 3 C5.8 5 5.8 7.5 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(72 7.5 9)"/>
<path d="M7.5 9 C9.2 7.5 9.2 5 7.5 3 C5.8 5 5.8 7.5 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(144 7.5 9)"/>
<path d="M7.5 9 C9.2 7.5 9.2 5 7.5 3 C5.8 5 5.8 7.5 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(216 7.5 9)"/>
<path d="M7.5 9 C9.2 7.5 9.2 5 7.5 3 C5.8 5 5.8 7.5 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(288 7.5 9)"/>
<!-- layer 2: 5 petals offset 36deg -->
<path d="M7.5 9 C8.8 7.8 8.8 5.8 7.5 4 C6.2 5.8 6.2 7.8 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(36 7.5 9)"/>
<path d="M7.5 9 C8.8 7.8 8.8 5.8 7.5 4 C6.2 5.8 6.2 7.8 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(108 7.5 9)"/>
<path d="M7.5 9 C8.8 7.8 8.8 5.8 7.5 4 C6.2 5.8 6.2 7.8 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(180 7.5 9)"/>
<path d="M7.5 9 C8.8 7.8 8.8 5.8 7.5 4 C6.2 5.8 6.2 7.8 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(252 7.5 9)"/>
<path d="M7.5 9 C8.8 7.8 8.8 5.8 7.5 4 C6.2 5.8 6.2 7.8 7.5 9Z" fill="none" stroke="#FFF" stroke-width="0.8" transform="rotate(324 7.5 9)"/>
<!-- center cluster -->
<circle cx="7.5" cy="9" r="1.2" fill="#FFF"/>
<circle cx="7.5" cy="7.2" r="0.8" fill="#FFF"/>
<circle cx="9.2" cy="8.4" r="0.8" fill="#FFF"/>
<circle cx="8.6" cy="10.4" r="0.8" fill="#FFF"/>
<circle cx="6.4" cy="10.4" r="0.8" fill="#FFF"/>
<circle cx="5.8" cy="8.4" r="0.8" fill="#FFF"/>
<!-- stem -->
<line x1="7.5" y1="13.5" x2="7.5" y2="18.5" stroke="#FFF" stroke-width="1.2" stroke-linecap="round"/>
<!-- leaf -->
<path d="M7.5 16.5 Q5 15 4.5 17" fill="none" stroke="#FFF" stroke-width="1" stroke-linecap="round"/>
<!-- pollen dots -->
<circle cx="14" cy="4.5" r="0.7" fill="#FFF"/>
<circle cx="15.5" cy="7" r="0.5" fill="#FFF"/>
<circle cx="16.5" cy="3.5" r="0.6" fill="#FFF"/>
<circle cx="13" cy="7.5" r="0.4" fill="#FFF"/>
</svg>`;
}

function wasteSvg(S) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 20 20">
<!-- lid -->
<rect x="4" y="4" width="12" height="1.8" rx="0.9" fill="#FFF"/>
<!-- handle -->
<path d="M7.5 4 V3 a2.5 2.5 0 0 1 5 0 V4" fill="none" stroke="#FFF" stroke-width="1.3"/>
<!-- body -->
<path d="M5 6.5 L6 17.5 a1 1 0 0 0 1 0.9 h6 a1 1 0 0 0 1-0.9 L15 6.5"
      fill="none" stroke="#FFF" stroke-width="1.3" stroke-linejoin="round"/>
<!-- lines -->
<line x1="8.5" y1="9" x2="8.5" y2="15.5" stroke="#FFF" stroke-width="1" stroke-linecap="round"/>
<line x1="11.5" y1="9" x2="11.5" y2="15.5" stroke="#FFF" stroke-width="1" stroke-linecap="round"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Icon definitions
// ---------------------------------------------------------------------------

const icons = [
	// Category / plugin icon
	{ svg: swissCrossSvg, sizes: [28, 56], dir: IMG_DIR, base: "plugin-icon" },
	// Action icons
	{ svg: sunSvg,      sizes: [20, 40], dir: join(IMG_DIR, "actions", "today"),    base: "action-icon" },
	{ svg: cloudSvg,    sizes: [20, 40], dir: join(IMG_DIR, "actions", "tomorrow"), base: "action-icon" },
	{ svg: forecastSvg, sizes: [20, 40], dir: join(IMG_DIR, "actions", "forecast"), base: "action-icon" },
	{ svg: pollenSvg,   sizes: [20, 40], dir: join(IMG_DIR, "actions", "pollen"),   base: "action-icon" },
	{ svg: wasteSvg,    sizes: [20, 40], dir: join(IMG_DIR, "actions", "waste"),    base: "action-icon" },
];

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

for (const icon of icons) {
	mkdirSync(icon.dir, { recursive: true });

	for (let i = 0; i < icon.sizes.length; i++) {
		const size = icon.sizes[i];
		const suffix = i === 0 ? "" : "@2x";
		const file = `${icon.base}${suffix}.png`;
		const svg = icon.svg(size);
		const svgPath = join(icon.dir, `_tmp_${file}.svg`);
		const pngPath = join(icon.dir, file);

		writeFileSync(svgPath, svg);
		execSync(`sips -s format png "${svgPath}" --out "${pngPath}"`, {
			stdio: "pipe",
		});
		unlinkSync(svgPath);

		console.log(`Generated ${file} (${size}x${size}) → ${pngPath}`);
	}
}

console.log("\nDone — all icons generated.");
