import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { putObject } from '$lib/server/r2';
import { convexClient } from '$lib/server/convex';
import { api } from '$convex/_generated/api';

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
};

// Upload an image. Returns { key, url } — the key goes into Convex,
// the url serves it back through GET /api/images/<key>.
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.token) error(401, 'Not signed in');
	const user = await convexClient(locals.token).query(api.auth.getCurrentUser, {});
	if (!user) error(401, 'Not signed in');

	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) error(400, 'Missing file');
	if (file.size > MAX_BYTES) error(413, 'Image too large (max 5 MB)');
	const ext = EXTENSIONS[file.type];
	if (!ext) error(415, 'Unsupported image type');

	const key = `img/${crypto.randomUUID()}.${ext}`;
	await putObject(key, await file.arrayBuffer(), file.type);
	return json({ key, url: `/api/images/${key}` });
};
