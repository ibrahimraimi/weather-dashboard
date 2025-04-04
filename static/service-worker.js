// Service Worker for Weather Dashboard
const CACHE_NAME = 'weather-dashboard-v1';
const STATIC_ASSETS = [
	'/',
	'/app.css',
	'/favicon.png',
	'/offline.html' // Add the offline page
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
			);
		})
	);
});

// Helper function to serialize a Request object
const serializeRequest = (request) => {
	const serialized = {
		url: request.url,
		headers: {}
	};

	request.headers.forEach((value, key) => {
		serialized.headers[key] = value;
	});

	return serialized;
};

// Helper function to create a cache key for an API response
const createCacheKey = (request) => {
	// Extract the city from the URL for weather API requests
	const url = new URL(request.url);

	if (url.pathname.includes('/api/weather')) {
		const city = url.searchParams.get('city');
		return `weather-api-${city}`;
	}

	return request.url;
};

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Handle API requests specially
	if (url.pathname.includes('/api/weather')) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Clone the response to store in cache
					const clonedResponse = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						// Store the response with a key that includes the city
						const cacheKey = createCacheKey(event.request);
						cache.put(cacheKey, clonedResponse);

						// Also store a serialized version of the request for lookup
						const serialized = serializeRequest(event.request);
						cache.put(`${cacheKey}-request`, new Response(JSON.stringify(serialized)));
					});

					return response;
				})
				.catch(() => {
					// If fetch fails, try to return from cache
					return caches.open(CACHE_NAME).then((cache) => {
						const cacheKey = createCacheKey(event.request);
						return cache.match(cacheKey).then((cachedResponse) => {
							if (cachedResponse) {
								return cachedResponse;
							}

							// If no cached response for this specific request,
							// return a fallback offline response
							return new Response(
								JSON.stringify({
									error: 'You are currently offline. This is cached weather data.',
									isOffline: true
								}),
								{
									headers: { 'Content-Type': 'application/json' },
									status: 200
								}
							);
						});
					});
				})
		);
	} else {
		// For non-API requests, use standard cache-first strategy
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				if (cachedResponse) {
					return cachedResponse;
				}

				return fetch(event.request)
					.then((response) => {
						// Don't cache non-200 responses
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response;
						}

						// Clone the response to store in cache
						const clonedResponse = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, clonedResponse);
						});

						return response;
					})
					.catch(() => {
						// For page requests when offline, return the offline page if we have one
						if (event.request.mode === 'navigate') {
							return caches.match('/offline.html') || caches.match('/');
						}

						// For other resources, just fail
						return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
					});
			})
		);
	}
});
