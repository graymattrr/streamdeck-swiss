import streamDeck, {
	action,
	type KeyDownEvent,
	type KeyUpEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
	type DidReceiveSettingsEvent,
} from "@elgato/streamdeck";

import type { ForecastSettings } from "../types/settings.js";
import { fetchForecast } from "../services/openmeteo-client.js";
import { renderForecast, renderError, renderSetup, encodeSvg } from "../rendering/svg-renderer.js";
import { cache } from "../services/weather-cache.js";

const POLL_INTERVAL = 30 * 60 * 1000;
const LONG_PRESS_MS = 1000;

@action({ UUID: "ch.swissdeck.plugin.weather.forecast" })
export class ForecastAction extends SingletonAction<ForecastSettings> {
	private timer: ReturnType<typeof setInterval> | null = null;
	private keyDownTime = new Map<string, number>();
	private updating = new Set<string>();

	override async onWillAppear(ev: WillAppearEvent<ForecastSettings>): Promise<void> {
		await this.updateButton(ev.action, ev.payload.settings);
		this.startPolling();
	}

	override onWillDisappear(_ev: WillDisappearEvent<ForecastSettings>): void {
		if (this.timer && this.actions.next().done) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	override onKeyDown(ev: KeyDownEvent<ForecastSettings>): void {
		this.keyDownTime.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent<ForecastSettings>): Promise<void> {
		const downTime = this.keyDownTime.get(ev.action.id) ?? Date.now();
		this.keyDownTime.delete(ev.action.id);

		if (Date.now() - downTime >= LONG_PRESS_MS) {
			cache.invalidateByPrefix("openmeteo:");
			await this.updateButton(ev.action, ev.payload.settings);
		} else if (ev.payload.settings.plz) {
			await streamDeck.system.openUrl(
				`https://www.meteoswiss.admin.ch/local-forecasts/${encodeURIComponent((ev.payload.settings as Record<string, string>).municipality?.toLowerCase().replace(/\s+/g, "-") || "zurich")}/${ev.payload.settings.plz}.html#forecast-tab=weekly-overview`,
			);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<ForecastSettings>): Promise<void> {
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

	private async updateButton(a: { setImage: (img: string) => Promise<void> }, settings: ForecastSettings): Promise<void> {
		const s = settings as Record<string, unknown>;
		const lat = s.plzLat as number || settings.stationLat;
		const lon = s.plzLon as number || settings.stationLon;
		if (!lat || !lon) {
			await a.setImage(encodeSvg(renderSetup()));
			return;
		}

		try {
			const forecast = await fetchForecast(lat, lon);
			const futureDays = forecast.daily.slice(1);
			if (futureDays.length === 0) {
				await a.setImage(encodeSvg(renderError("No data")));
				return;
			}
			await a.setImage(encodeSvg(renderForecast(futureDays)));
		} catch (err) {
			streamDeck.logger.error(`Forecast update failed: ${err}`);
			await a.setImage(encodeSvg(renderError("Offline")));
		}
	}
}
