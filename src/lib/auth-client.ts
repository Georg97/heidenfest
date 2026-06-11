import { createAuthClient } from 'better-auth/svelte';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

// No baseURL — better-auth uses the current window origin, so the same
// build works on localhost and on the deployed domain. Auth requests hit
// /api/auth/*, which SvelteKit proxies to the Convex deployment.
export const authClient = createAuthClient({
	plugins: [convexClient()]
});
