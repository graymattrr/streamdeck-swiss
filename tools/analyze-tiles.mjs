// Find tile bounding boxes by scanning for tile-fill pixels.
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

async function boundsPerColumn(file) {
	const path = resolve(root, "marketplace", file);
	const img = sharp(path);
	const { width, height } = await img.metadata();
	const raw = await img.raw().toBuffer();
	const ch = raw.length / (width * height);

	// Tile-fill: r in [15,50], b in [35,80]. Excludes page bg and bright content.
	function isTileFill(o) {
		const r = raw[o], g = raw[o + 1], b = raw[o + 2];
		return r >= 15 && r <= 50 && b >= 35 && b <= 80;
	}

	// Per-column: count tile-fill pixels. Columns with high counts are "inside a tile".
	const colCounts = new Int32Array(width);
	for (let y = 0; y < height; y++) {
		const rowBase = y * width * ch;
		for (let x = 0; x < width; x++) {
			if (isTileFill(rowBase + x * ch)) colCounts[x]++;
		}
	}
	// Per-row: same
	const rowCounts = new Int32Array(height);
	for (let y = 0; y < height; y++) {
		const rowBase = y * width * ch;
		let c = 0;
		for (let x = 0; x < width; x++) {
			if (isTileFill(rowBase + x * ch)) c++;
		}
		rowCounts[y] = c;
	}

	// A column belongs to a tile if count > threshold (say 8).
	function runs(counts, threshold, minLen = 20) {
		const out = [];
		let start = -1;
		for (let i = 0; i < counts.length; i++) {
			if (counts[i] > threshold && start < 0) start = i;
			else if (counts[i] <= threshold && start >= 0) {
				if (i - start >= minLen) out.push([start, i - 1]);
				start = -1;
			}
		}
		if (start >= 0 && counts.length - start >= minLen) out.push([start, counts.length - 1]);
		return out;
	}

	const colRuns = runs(colCounts, 8);
	const rowRuns = runs(rowCounts, 8);
	console.log(`\n=== ${file} (${width}x${height}) ===`);
	console.log("  column runs (tile x-bands):", colRuns);
	console.log("  row runs    (tile y-bands):", rowRuns);
}

await boundsPerColumn("gallery-2-pollen.png");
await boundsPerColumn("thumbnail.png");
