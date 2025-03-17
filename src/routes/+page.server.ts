import type { Actions, PageServerLoad } from './$types';

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

interface ApiResponse {
	weatherData: WeatherData;
	forecast: ForecastItem[];
	error?: string;
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const city = url.searchParams.get('city');

	if (!city) {
		return {
			weatherData: null,
			forecast: [],
			city: '',
			error: null
		};
	}

	try {
		const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
		const data = (await response.json()) as ApiResponse;

		if (!response.ok) {
			throw new Error(data.error || 'Failed to fetch weather data');
		}

		return {
			weatherData: data.weatherData,
			forecast: data.forecast,
			city,
			error: null
		};
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
		return {
			weatherData: null,
			forecast: [],
			city,
			error: errorMessage
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
