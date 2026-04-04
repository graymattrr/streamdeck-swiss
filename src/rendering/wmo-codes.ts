export type WeatherInfo = {
	description: string;
	icon: string; // key into WEATHER_ICONS
};

export const WMO_CODES: Record<number, WeatherInfo> = {
	0: { description: "Clear sky", icon: "clear" },
	1: { description: "Mainly clear", icon: "mostly-clear" },
	2: { description: "Partly cloudy", icon: "partly-cloudy" },
	3: { description: "Overcast", icon: "overcast" },
	45: { description: "Fog", icon: "fog" },
	48: { description: "Rime fog", icon: "fog" },
	51: { description: "Light drizzle", icon: "drizzle" },
	53: { description: "Moderate drizzle", icon: "drizzle" },
	55: { description: "Dense drizzle", icon: "drizzle" },
	56: { description: "Freezing drizzle", icon: "drizzle" },
	57: { description: "Heavy freezing drizzle", icon: "drizzle" },
	61: { description: "Slight rain", icon: "rain" },
	63: { description: "Moderate rain", icon: "rain" },
	65: { description: "Heavy rain", icon: "heavy-rain" },
	66: { description: "Freezing rain", icon: "rain" },
	67: { description: "Heavy freezing rain", icon: "heavy-rain" },
	71: { description: "Slight snow", icon: "snow" },
	73: { description: "Moderate snow", icon: "snow" },
	75: { description: "Heavy snow", icon: "heavy-snow" },
	77: { description: "Snow grains", icon: "snow" },
	80: { description: "Slight showers", icon: "rain" },
	81: { description: "Moderate showers", icon: "rain" },
	82: { description: "Violent showers", icon: "heavy-rain" },
	85: { description: "Slight snow showers", icon: "snow" },
	86: { description: "Heavy snow showers", icon: "heavy-snow" },
	95: { description: "Thunderstorm", icon: "thunderstorm" },
	96: { description: "Thunderstorm with hail", icon: "thunderstorm" },
	99: { description: "Heavy thunderstorm with hail", icon: "thunderstorm" },
};

export function getWeatherInfo(code: number): WeatherInfo {
	return WMO_CODES[code] ?? { description: "Unknown", icon: "overcast" };
}
