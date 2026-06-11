import type { LayoutServerLoad } from './$types';
import { getAuthState } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { createConvexHttpClient } from 'convex-svelte/sveltekit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api';

export const load: LayoutServerLoad = async ({ locals }) => {
	let user = null;
	if (locals.token) {
		const client = createConvexHttpClient({ url: PUBLIC_CONVEX_URL, token: locals.token });
		user = await client.query(api.auth.getCurrentUser, {});
	}
	return {
		authState: getAuthState(),
		user
	};
};
