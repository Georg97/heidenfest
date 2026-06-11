import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getObject } from '$lib/server/r2';

// Serve images from R2. Keys are unguessable UUIDs; long-lived caching is fine
// because uploads always create new keys.
export const GET: RequestHandler = async ({ params }) => {
	const key = params.key;
	if (!key || !key.startsWith('img/') || key.includes('..')) error(404, 'Not found');

	const object = await getObject(key);
	if (!object.ok) error(404, 'Not found');

	return new Response(object.body, {
		headers: {
			'content-type': object.headers.get('content-type') ?? 'application/octet-stream',
			'cache-control': 'public, max-age=31536000, immutable'
		}
	});
};
