import { AwsClient } from 'aws4fetch';
import { env } from '$env/dynamic/private';

// Cloudflare R2 via the S3 API (path-style). Convex storage is intentionally
// not used (free tier) — Convex only ever stores the object keys.
let client: AwsClient | null = null;

function r2(): AwsClient {
	if (!client) {
		if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ENDPOINT || !env.R2_BUCKET) {
			throw new Error('R2 environment variables are not configured');
		}
		client = new AwsClient({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			service: 's3',
			region: 'auto'
		});
	}
	return client;
}

function objectUrl(key: string): string {
	return `${env.R2_ENDPOINT!.replace(/\/$/, '')}/${env.R2_BUCKET}/${key}`;
}

export async function putObject(key: string, body: ArrayBuffer, contentType: string): Promise<void> {
	const res = await r2().fetch(objectUrl(key), {
		method: 'PUT',
		body,
		headers: { 'content-type': contentType }
	});
	if (!res.ok) {
		throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
	}
}

export async function getObject(key: string): Promise<Response> {
	return await r2().fetch(objectUrl(key));
}

export async function deleteObject(key: string): Promise<void> {
	await r2().fetch(objectUrl(key), { method: 'DELETE' });
}
