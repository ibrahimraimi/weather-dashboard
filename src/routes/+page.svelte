<script lang="ts">
	import {
		Sun,
		Cloud,
		CloudRain,
		CloudSnow,
		CloudLightning,
		Wind,
		Droplets,
		Thermometer,
		Loader
	} from 'lucide-svelte';
	import type { ComponentType } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let city = data.city || '';
	let loading = false;

	// Weather icon mapping
	const getWeatherIcon = (condition: string): ComponentType => {
		const iconMap: Record<string, ComponentType> = {
			Clear: Sun,
			Clouds: Cloud,
			Rain: CloudRain,
			Snow: CloudSnow,
			Thunderstorm: CloudLightning,
			Drizzle: CloudRain,
			Mist: Cloud,
			Fog: Cloud
		};

		return iconMap[condition] || Cloud;
	};

	// Format date
	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	};

	// Format time
	const formatTime = (timestamp: number): string => {
		const date = new Date(timestamp * 1000);
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
	};

	// Get background class based on weather condition
	function getBackgroundClass(condition: string | undefined): string {
		if (!condition) return 'bg-blue-50';

		const conditionMap: Record<string, string> = {
			Clear: 'bg-yellow-50',
			Clouds: 'bg-gray-100',
			Rain: 'bg-blue-100',
			Snow: 'bg-slate-50',
			Thunderstorm: 'bg-purple-100',
			Drizzle: 'bg-blue-50'
		};

		return conditionMap[condition] || 'bg-blue-50';
	}

	// Handle form submission with client-side navigation
	function handleSubmit() {
		if (city.trim()) {
			loading = true;
			goto(`?city=${encodeURIComponent(city)}`).then(() => {
				loading = false;
			});
		}
	}
</script>

<div
	class="min-h-screen {data.weatherData
		? getBackgroundClass(data.weatherData.weather[0].main)
		: 'bg-blue-50'} transition-colors duration-500"
>
	<div class="container mx-auto px-4 py-8">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-800">Weather Dashboard</h1>

		<!-- Search Form -->
		<div class="mx-auto mb-8 max-w-md">
			<form
				method="POST"
				on:submit|preventDefault={handleSubmit}
				use:enhance={() => {
					loading = true;
					return ({ result }) => {
						if (result.type === 'success' && result.data?.city) {
							goto(`?city=${encodeURIComponent(String(result.data.city))}`);
						}
						loading = false;
					};
				}}
				class="flex gap-2"
			>
				<input
					type="text"
					name="city"
					bind:value={city}
					placeholder="Enter city name"
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					disabled={loading}
				/>
				<button
					type="submit"
					class="flex min-w-[100px] items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600 disabled:opacity-70"
					disabled={loading}
				>
					{#if loading}
						<Loader class="spin mr-2 h-5 w-5" />
						<span>Loading</span>
					{:else}
						<span>Search</span>
					{/if}
				</button>
			</form>

			{#if data.error}
				<div class="mt-2 text-sm text-red-500">{data.error}</div>
			{/if}
		</div>

		<!-- Current Weather -->
		{#if data.weatherData}
			<div class="mx-auto mb-8 max-w-md overflow-hidden rounded-xl bg-white shadow-md">
				<div class="p-6">
					<div class="mb-4 flex items-center justify-between">
						<div>
							<h2 class="text-2xl font-bold text-gray-800">
								{data.weatherData.name}, {data.weatherData.sys.country}
							</h2>
							<p class="text-gray-600">{formatDate(data.weatherData.dt)}</p>
						</div>
						<div class="text-right">
							<div class="text-3xl font-bold text-gray-800">
								{Math.round(data.weatherData.main.temp)}°C
							</div>
							<p class="text-gray-600">
								Feels like {Math.round(data.weatherData.main.feels_like)}°C
							</p>
						</div>
					</div>

					<div class="mb-4 flex items-center">
						<svelte:component
							this={getWeatherIcon(data.weatherData.weather[0].main)}
							class="mr-4 h-12 w-12 text-blue-500"
						/>
						<div>
							<div class="text-lg font-medium text-gray-800">
								{data.weatherData.weather[0].main}
							</div>
							<div class="text-gray-600">{data.weatherData.weather[0].description}</div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="flex items-center">
							<Wind class="mr-2 h-5 w-5 text-gray-500" />
							<span class="text-gray-700">{data.weatherData.wind.speed} m/s</span>
						</div>
						<div class="flex items-center">
							<Droplets class="mr-2 h-5 w-5 text-gray-500" />
							<span class="text-gray-700">{data.weatherData.main.humidity}%</span>
						</div>
						<div class="flex items-center">
							<Thermometer class="mr-2 h-5 w-5 text-gray-500" />
							<span class="text-gray-700">{data.weatherData.main.pressure} hPa</span>
						</div>
						<div class="flex items-center">
							<Sun class="mr-2 h-5 w-5 text-gray-500" />
							<span class="text-gray-700">UV Index: N/A</span>
						</div>
					</div>

					<div class="mt-4 flex justify-between text-sm text-gray-600">
						<div>
							<div>Sunrise</div>
							<div>{formatTime(data.weatherData.sys.sunrise)}</div>
						</div>
						<div class="text-right">
							<div>Sunset</div>
							<div>{formatTime(data.weatherData.sys.sunset)}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Forecast -->
			{#if data.forecast.length > 0}
				<div class="mx-auto max-w-4xl">
					<h3 class="mb-4 text-xl font-semibold text-gray-800">5-Day Forecast</h3>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
						{#each data.forecast as day}
							<div class="rounded-lg bg-white p-4 shadow-md">
								<div class="font-medium text-gray-600">{formatDate(day.dt)}</div>
								<div class="my-2 flex items-center justify-between">
									<svelte:component
										this={getWeatherIcon(day.weather[0].main)}
										class="h-10 w-10 text-blue-500"
									/>
									<div class="text-xl font-bold text-gray-800">{Math.round(day.main.temp)}°C</div>
								</div>
								<div class="text-sm text-gray-600">{day.weather[0].description}</div>
								<div class="mt-2 flex justify-between text-xs text-gray-500">
									<span>H: {Math.round(day.main.temp_max)}°</span>
									<span>L: {Math.round(day.main.temp_min)}°</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else if !loading}
			<div class="mx-auto max-w-md text-center text-gray-600">
				<p>Enter a city name to get the weather forecast</p>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Add spinning animation for the loader */
	.spin {
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
