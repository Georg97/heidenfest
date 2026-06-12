import type { RequestHandler } from './$types';
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

/**
 * Proxies /api/auth/* to Better Auth running inside Convex (HTTP actions),
 * keeping cookies and OAuth redirects on the app origin.
 *
 * Hand-rolled instead of the library's createSvelteKitHandler: on Vercel its
 * pass-through of the streamed request body made upstream POSTs fail with
 * "TypeError: fetch failed" (e.g. email sign-in). We buffer the body — auth
 * payloads are tiny — and retry once on transient connection errors.
 */

const FORWARDED_HEADERS = new Set([
	'accept',
	'authorization',
	'better-auth-cookie',
	'content-type',
	'cookie',
	'origin',
	'referer',
	'user-agent'
]);

const handler: RequestHandler = async ({ request }) => {
	if (!PUBLIC_CONVEX_SITE_URL) {
		throw new Error('PUBLIC_CONVEX_SITE_URL environment variable is not set');
	}
	const requestUrl = new URL(request.url);
	const target = `${PUBLIC_CONVEX_SITE_URL}${requestUrl.pathname}${requestUrl.search}`;

	const headers = new Headers();
	for (const [name, value] of request.headers) {
		if (FORWARDED_HEADERS.has(name)) headers.set(name, value);
	}
	headers.set('x-forwarded-host', requestUrl.host);
	headers.set('x-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	headers.set('x-better-auth-forwarded-host', requestUrl.host);
	headers.set('x-better-auth-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	headers.set('accept-encoding', 'identity');

	const body =
		request.method === 'GET' || request.method === 'HEAD'
			? undefined
			: await request.arrayBuffer();
	const attempt = () =>
		fetch(target, { method: request.method, headers, body, redirect: 'manual' });

	try {
		return await attempt();
	} catch (error) {
		console.error(
			'auth proxy upstream fetch failed, retrying once:',
			error,
			'cause:',
			(error as Error)?.cause
		);
		return await attempt();
	}
};

export const GET = handler;
export const POST = handler;
