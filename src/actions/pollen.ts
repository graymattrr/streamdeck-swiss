import streamDeck, {
	action,
	type KeyDownEvent,
	type KeyUpEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
	type DidReceiveSettingsEvent,
} from "@elgato/streamdeck";

import type { PollenSettings, PollenTypeKey } from "../types/pollen.js";
import { fetchPollenData } from "../services/pollen-client.js";
import { renderPollen, renderError, renderSetup, encodeSvg } from "../rendering/svg-renderer.js";
import { cache } from "../services/weather-cache.js";

const POLL_INTERVAL = 60 * 60 * 1000;
const LONG_PRESS_MS = 1000;

@action({ UUID: "ch.swissdeck.plugin.pollen" })
export class PollenAction extends SingletonAction<PollenSettings> {
	private timer: ReturnType<typeof setInterval> | null = null;
	private keyDownTime = new Map<string, number>();
	private updating = new Set<string>();

	override async onWillAppear(ev: WillAppearEvent<PollenSettings>): Promise<void> {
		await this.updateButton(ev.action, ev.payload.settings);
		this.startPolling();
	}

	override onWillDisappear(_ev: WillDisappearEvent<PollenSettings>): void {
		if (this.timer && this.actions.next().done) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	override onKeyDown(ev: KeyDownEvent<PollenSettings>): void {
		this.keyDownTime.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent<PollenSettings>): Promise<void> {
		const downTime = this.keyDownTime.get(ev.action.id) ?? Date.now();
		this.keyDownTime.delete(ev.action.id);

		if (Date.now() - downTime >= LONG_PRESS_MS) {
			cache.invalidateByPrefix("pollen:");
			await this.updateButton(ev.action, ev.payload.settings);
		} else {
			await streamDeck.system.openUrl("https://www.meteoswiss.admin.ch/services-and-publications/applications/pollen-forecast.html#tab=pollen-map&pollen=all");
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<PollenSettings>): Promise<void> {
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

	private async updateButton(a: { setImage: (img: string) => Promise<void> }, settings: PollenSettings): Promise<void> {
		if (!settings.pollenStationId) {
			await a.setImage(encodeSvg(renderSetup()));
			return;
		}

		try {
			const reading = await fetchPollenData(settings.pollenStationId);
			if (!reading) {
				await a.setImage(encodeSvg(renderError("No data")));
				return;
			}

			const allergens = (settings.allergens || []) as PollenTypeKey[];
			await a.setImage(encodeSvg(renderPollen(reading, allergens, settings.pollenStationName)));
		} catch (err) {
			streamDeck.logger.error(`Pollen update failed: ${err}`);
			await a.setImage(encodeSvg(renderError("Offline")));
		}
	}
}
