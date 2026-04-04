import streamDeck, {
	action,
	type KeyDownEvent,
	type KeyUpEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
	type DidReceiveSettingsEvent,
} from "@elgato/streamdeck";

import type { TomorrowSettings } from "../types/settings.js";
import { fetchForecast } from "../services/openmeteo-client.js";
import { renderTomorrow, renderError, renderSetup, encodeSvg } from "../rendering/svg-renderer.js";
import { cache } from "../services/weather-cache.js";

const POLL_INTERVAL = 30 * 60 * 1000;
const LONG_PRESS_MS = 1000;

@action({ UUID: "ch.swissdeck.weather.tomorrow" })
export class TomorrowAction extends SingletonAction<TomorrowSettings> {
	private timer: ReturnType<typeof setInterval> | null = null;
	private keyDownTime = new Map<string, number>();

	override async onWillAppear(ev: WillAppearEvent<TomorrowSettings>): Promise<void> {
		await this.updateButton(ev.action);
		this.startPolling();
	}

	override onWillDisappear(_ev: WillDisappearEvent<TomorrowSettings>): void {
		if (this.timer && this.actions.next().done) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	override onKeyDown(ev: KeyDownEvent<TomorrowSettings>): void {
		this.keyDownTime.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent<TomorrowSettings>): Promise<void> {
		const downTime = this.keyDownTime.get(ev.action.id) ?? Date.now();
		this.keyDownTime.delete(ev.action.id);

		if (Date.now() - downTime >= LONG_PRESS_MS) {
			cache.invalidateAll();
			await this.updateButton(ev.action);
		} else if (ev.payload.settings.plz) {
			await streamDeck.system.openUrl(
				`https://www.meteoswiss.admin.ch/local-forecasts/${encodeURIComponent((ev.payload.settings as Record<string, string>).municipality?.toLowerCase().replace(/\s+/g, "-") || "zurich")}/${ev.payload.settings.plz}.html#forecast-tab=weekly-overview`,
			);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<TomorrowSettings>): Promise<void> {
		await this.updateButton(ev.action);
	}

	private startPolling(): void {
		if (this.timer) return;
		this.timer = setInterval(() => this.updateAllButtons(), POLL_INTERVAL);
	}

	private async updateAllButtons(): Promise<void> {
		for await (const a of this.actions) {
			await this.updateButton(a);
		}
	}

	private async updateButton(a: { getSettings: () => Promise<TomorrowSettings>; setImage: (img: string) => Promise<void> }): Promise<void> {
		const settings = await a.getSettings();
		const s = settings as Record<string, unknown>;
		const lat = s.plzLat as number || settings.stationLat;
		const lon = s.plzLon as number || settings.stationLon;
		if (!lat || !lon) {
			await a.setImage(encodeSvg(renderSetup()));
			return;
		}

		try {
			const forecast = await fetchForecast(lat, lon, 2);
			const tomorrow = forecast.daily[1];
			if (!tomorrow) {
				await a.setImage(encodeSvg(renderError("No data")));
				return;
			}
			await a.setImage(encodeSvg(renderTomorrow(tomorrow)));
		} catch (err) {
			streamDeck.logger.error(`Tomorrow update failed: ${err}`);
			await a.setImage(encodeSvg(renderError("Offline")));
		}
	}
}
