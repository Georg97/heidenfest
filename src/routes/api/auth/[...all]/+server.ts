import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import type { RequestHandler } from './$types';
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

// Proxies /api/auth/* to Better Auth running inside Convex (HTTP actions),
// keeping cookies and OAuth redirects on the app origin.
const handler = createSvelteKitHandler({ convexSiteUrl: PUBLIC_CONVEX_SITE_URL });

// On Vercel, function instances are reused and undici keeps idle keep-alive
// connections to Convex that Convex eventually closes. undici transparently
// retries GETs on such dead sockets but never POSTs, so the first POST after
// an idle period fails with "TypeError: fetch failed" (this broke email
// sign-in). Clone the request up front and retry once on a fresh connection.
const withRetry =
	(inner: RequestHandler): RequestHandler =>
	async (event) => {
		const retryRequest = event.request.clone();
		try {
			return await inner(event);
		} catch {
			return await inner({ ...event, request: retryRequest });
		}
	};

export const GET = withRetry(handler.GET);
export const POST = withRetry(handler.POST);
