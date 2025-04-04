export interface WeatherData {
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

export interface ForecastItem {
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
