import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENWEATHERMAP_API_KEY } from '$env/static/private';
import type { WeatherData, ForecastItem } from './types';

interface ForecastResponse {
	list: ForecastItem[];
}

interface RequestData {
	isOffline?: boolean;
	error?: string;
}

export const GET: RequestHandler = async ({ url, request }) => {
	const city = url.searchParams.get('city');

	if (!city) {
		return json({ error: 'City parameter is required' }, { status: 400 });
	}

	// Check if the request has the isOffline flag (set by service worker)
	let isOffline = false;
	try {
		const requestData = (await request.clone().json()) as RequestData;
		isOffline = !!requestData.isOffline;

		// If we're offline and the service worker is returning cached data
		if (isOffline) {
			// We'll let the cached data flow through from the service worker
			return json(await request.json());
		}
	} catch (e) {
		// Not JSON or doesn't have the expected structure, assume it's a normal request
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
			forecast,
			isOffline: false
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
		return json({ error: errorMessage, isOffline: false }, { status: 500 });
	}
};
