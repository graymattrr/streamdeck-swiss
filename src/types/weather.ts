export type CurrentMeasurements = {
	stationId: string;
	stationName: string;
	temperature: number | null;
	precipitation: number | null;
	windSpeed: number | null;
	humidity: number | null;
	timestamp: string;
};

export type DayForecast = {
	date: string;
	weatherCode: number;
	tempMax: number;
	tempMin: number;
	precipitationSum: number;
	precipProbability: number;
	sunshineHours: number;
};

export type ForecastData = {
	current: {
		temperature: number;
		weatherCode: number;
		windSpeed: number;
	};
	daily: DayForecast[];
};
