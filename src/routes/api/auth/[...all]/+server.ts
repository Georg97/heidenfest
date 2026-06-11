import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

// Proxies /api/auth/* to Better Auth running inside Convex (HTTP actions),
// keeping cookies and OAuth redirects on the app origin.
export const { GET, POST } = createSvelteKitHandler({ convexSiteUrl: PUBLIC_CONVEX_SITE_URL });
