import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENWEATHERMAP_API_KEY } from '$env/static/private';

interface WeatherData {
	name: string;
	dt: number;
	sys: {
		country: string;
		sunrise: number;
		sunset: number;
	};
	main: {
		temp: number;
		feels_like: number;
		humidity: number;
		pressure: number;
		temp_min: number;
		temp_max: number;
	};
	weather: Array<{
		main: string;
		description: string;
	}>;
	wind: {
		speed: number;
	};
}

interface ForecastItem {
	dt: number;
	main: {
		temp: number;
		temp_min: number;
		temp_max: number;
	};
	weather: Array<{
		main: string;
		description: string;
	}>;
}

interface ForecastResponse {
	list: ForecastItem[];
}

export const GET: RequestHandler = async ({ url }) => {
	const city = url.searchParams.get('city');

	if (!city) {
		return json({ error: 'City parameter is required' }, { status: 400 });
	}

	try {
		const apiKey = OPENWEATHERMAP_API_KEY;
		const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
		const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

		// Fetch current weather
		const weatherResponse = await fetch(currentWeatherUrl);
		if (!weatherResponse.ok) {
			const errorData = await weatherResponse.json();
			throw new Error(errorData.message || 'City not found');
		}
		const weatherData: WeatherData = await weatherResponse.json();

		// Fetch forecast
		const forecastResponse = await fetch(forecastUrl);
		if (!forecastResponse.ok) {
			throw new Error('Forecast not available');
		}
		const forecastData: ForecastResponse = await forecastResponse.json();

		// Process forecast data (get one forecast per day)
		const dailyForecasts: Record<string, ForecastItem> = {};
		forecastData.list.forEach((item) => {
			const date = new Date(item.dt * 1000).toDateString();
			if (!dailyForecasts[date] || new Date(item.dt * 1000).getHours() === 12) {
				dailyForecasts[date] = item;
			}
		});

		const forecast = Object.values(dailyForecasts).slice(0, 5);

		return json({
			weatherData,
			forecast
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
		return json({ error: errorMessage }, { status: 500 });
	}
};
