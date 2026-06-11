import { createConvexHttpClient } from 'convex-svelte/sveltekit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

/** Convex HTTP client for server-side calls, authenticated when a token is given. */
export function convexClient(token?: string) {
	return createConvexHttpClient({ url: PUBLIC_CONVEX_URL, token });
}
