#!/usr/bin/env node
/**
 * Generate plugin icon PNGs using Swiss cross mathematical proportions.
 *
 * Swiss cross formula:
 *   arm width  = S / 5
 *   arm length = 3S / 5
 *
 * Uses macOS `sips` to convert SVG → PNG.
 *
 * Usage: node scripts/generate-icons.js
 */

const { writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const { join } = require("path");

const ICON_DIR = join(__dirname, "..", "ch.swissdeck.plugin.sdPlugin", "imgs");
const RED = "#D52B1E";

function swissCrossSvg(size) {
	const S = size;
	const armW = S / 5;
	const armL = (3 * S) / 5;
	const cx = S / 2;
	const cy = S / 2;
	const rx = Math.max(1, Math.round(S / 14)); // corner radius scales with size

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" rx="${rx * 2}" fill="${RED}"/>
<rect x="${cx - armW / 2}" y="${cy - armL / 2}" width="${armW}" height="${armL}" rx="${rx}" fill="#FFFFFF"/>
<rect x="${cx - armL / 2}" y="${cy - armW / 2}" width="${armL}" height="${armW}" rx="${rx}" fill="#FFFFFF"/>
</svg>`;
}

const sizes = [
	{ size: 28, file: "plugin-icon.png" },
	{ size: 56, file: "plugin-icon@2x.png" },
];

for (const { size, file } of sizes) {
	const svg = swissCrossSvg(size);
	const svgPath = join(ICON_DIR, `_tmp_${file}.svg`);
	const pngPath = join(ICON_DIR, file);

	writeFileSync(svgPath, svg);
	execSync(`sips -s format png "${svgPath}" --out "${pngPath}"`, { stdio: "pipe" });
	unlinkSync(svgPath);

	console.log(`Generated ${file} (${size}x${size})`);
}
