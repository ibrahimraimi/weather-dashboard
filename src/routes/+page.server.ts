import type { Actions, PageServerLoad } from './$types';
import type { WeatherData, ForecastItem } from './api/weather/types';

interface ApiResponse {
	weatherData: WeatherData;
	forecast: ForecastItem[];
	error?: string;
	isOffline?: boolean;
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const city = url.searchParams.get('city');

	if (!city) {
		return {
			weatherData: null,
			forecast: [],
			city: '',
			error: null,
			isOffline: false
		};
	}

	try {
		const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
		const data = (await response.json()) as ApiResponse;

		if (!response.ok && !data.isOffline) {
			throw new Error(data.error || 'Failed to fetch weather data');
		}

		return {
			weatherData: data.weatherData,
			forecast: data.forecast,
			city,
			error: null,
			isOffline: data.isOffline || false
		};
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
		return {
			weatherData: null,
			forecast: [],
			city,
			error: errorMessage,
			isOffline: false
		};
	}
};

// Form actions for handling city search
export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const city = formData.get('city') as string;
		return { success: true, city };
	}
};
