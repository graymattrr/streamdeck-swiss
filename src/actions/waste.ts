import streamDeck, {
	action,
	type KeyDownEvent,
	type KeyUpEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
	type DidReceiveSettingsEvent,
} from "@elgato/streamdeck";

import type { WasteSettings } from "../types/waste.js";
import { fetchWasteSchedule, getNextCollection, getUpcomingByType } from "../services/waste-client.js";
import { renderWaste, renderError, encodeSvg } from "../rendering/svg-renderer.js";
import { cache } from "../services/weather-cache.js";

const POLL_INTERVAL = 60 * 60 * 1000;
const LONG_PRESS_MS = 1000;

@action({ UUID: "ch.swissdeck.waste" })
export class WasteAction extends SingletonAction<WasteSettings> {
	private timer: ReturnType<typeof setInterval> | null = null;
	private keyDownTime = new Map<string, number>();
	private updating = new Set<string>();

	override async onWillAppear(ev: WillAppearEvent<WasteSettings>): Promise<void> {
		await this.updateButton(ev.action, ev.payload.settings);
		this.startPolling();
	}

	override onWillDisappear(_ev: WillDisappearEvent<WasteSettings>): void {
		if (this.timer && this.actions.next().done) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	override onKeyDown(ev: KeyDownEvent<WasteSettings>): void {
		this.keyDownTime.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent<WasteSettings>): Promise<void> {
		const downTime = this.keyDownTime.get(ev.action.id) ?? Date.now();
		this.keyDownTime.delete(ev.action.id);

		if (Date.now() - downTime >= LONG_PRESS_MS) {
			cache.invalidateByPrefix("waste:");
			await this.updateButton(ev.action, ev.payload.settings);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<WasteSettings>): Promise<void> {
		if (this.updating.has(ev.action.id)) return;
		await this.updateButton(ev.action, ev.payload.settings);
	}

	private startPolling(): void {
		if (this.timer) return;
		this.timer = setInterval(() => this.updateAllButtons(), POLL_INTERVAL);
	}

	private async updateAllButtons(): Promise<void> {
		for await (const a of this.actions) {
			this.updating.add(a.id);
			try {
				const settings = await a.getSettings();
				await this.updateButton(a, settings);
			} finally {
				this.updating.delete(a.id);
			}
		}
	}

	private async updateButton(a: { setImage: (img: string) => Promise<void> }, settings: WasteSettings): Promise<void> {
		if (!settings.plz) {
			const setupSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
				<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/>
				</linearGradient></defs>
				<rect width="144" height="144" fill="url(#bg)" rx="8"/>
				<text x="72" y="55" text-anchor="middle" font-size="36">🗑</text>
				<text x="72" y="90" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">OpenERZ</text>
				<text x="72" y="118" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#A0AEC0">Enter PLZ</text>
			</svg>`;
			await a.setImage(encodeSvg(setupSvg));
			return;
		}

		try {
			const schedule = await fetchWasteSchedule(settings.plz, settings.area || undefined);
			const next = getNextCollection(schedule);
			const upcoming = getUpcomingByType(schedule);
			await a.setImage(encodeSvg(renderWaste(next, upcoming)));
		} catch (err) {
			streamDeck.logger.error(`Waste update failed: ${err}`);
			await a.setImage(encodeSvg(renderError("Offline")));
		}
	}
}
