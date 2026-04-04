import type { ForecastData } from "../types/weather.js";
import { cache } from "./weather-cache.js";

const BASE = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

type OpenMeteoResponse = {
	current: {
		temperature_2m: number;
		weather_code: number;
		wind_speed_10m: number;
	};
	daily: {
		time: string[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
		precipitation_probability_max: number[];
		sunshine_duration: number[];
	};
};

export async function fetchForecast(
	lat: number,
	lon: number,
	days: number = 3,
): Promise<ForecastData> {
	const cacheKey = `openmeteo:${lat.toFixed(4)},${lon.toFixed(4)},${days}`;
	const cached = cache.get<ForecastData>(cacheKey);
	if (cached) return cached;

	const params = new URLSearchParams({
		latitude: lat.toString(),
		longitude: lon.toString(),
		current: "temperature_2m,weather_code,wind_speed_10m",
		daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunshine_duration",
		timezone: "Europe/Zurich",
		forecast_days: days.toString(),
	});

	const res = await fetch(`${BASE}?${params}`);
	if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);

	const raw = (await res.json()) as OpenMeteoResponse;

	const result: ForecastData = {
		current: {
			temperature: raw.current.temperature_2m,
			weatherCode: raw.current.weather_code,
			windSpeed: raw.current.wind_speed_10m,
		},
		daily: raw.daily.time.map((date, i) => {
			const wmo = raw.daily.weather_code[i];
			const precipProb = raw.daily.precipitation_probability_max?.[i] ?? 0;
			const sunSeconds = raw.daily.sunshine_duration?.[i] ?? 0;
			const sunHours = sunSeconds / 3600;

			// Derive icon from sunshine + precip instead of raw WMO code.
			// WMO daily codes over-report rain (any overnight drizzle = "rain day").
			// Use sunshine hours and precip probability for a fairer icon.

			let code = wmo;
			if (wmo >= 51) {
				// Rain/snow codes — check if it's actually a sunny day.
				// Sunshine hours is the strongest signal; precip probability
				// over-reports because it includes any brief overnight drizzle.
				if (sunHours >= 8 && precipProb <= 50) {
					code = 1; // mostly clear
				} else if (sunHours >= 5 && precipProb <= 60) {
					code = 2; // partly cloudy
				} else if (sunHours >= 3) {
					code = 3; // overcast (but not rain)
				}
				// else keep the rain code (< 3h sunshine)
			}

			return {
				date,
				weatherCode: code,
				tempMax: raw.daily.temperature_2m_max[i],
				tempMin: raw.daily.temperature_2m_min[i],
				precipitationSum: raw.daily.precipitation_sum[i],
				precipProbability: precipProb,
				sunshineHours: sunHours,
			};
		}),
	};

	cache.set(cacheKey, result, CACHE_TTL);
	return result;
}
