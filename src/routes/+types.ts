import type { ForecastItem, WeatherData } from './api/weather/types';

export interface PageData {
	weatherData: WeatherData | null;
	forecast: ForecastItem[] | [];
	city: string;
	error: string | null;
	isOffline: boolean;
}
