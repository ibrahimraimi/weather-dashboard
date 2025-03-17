import type { PageLoad } from './$types';

// This is needed to make the data from +page.server.ts available on the client
export const load: PageLoad = async ({ data }) => {
	return {
		weatherData: data.weatherData,
		forecast: data.forecast,
		city: data.city,
		error: data.error
	};
};
