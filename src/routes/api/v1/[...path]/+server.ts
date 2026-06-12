import { json, error, type RequestEvent } from '@sveltejs/kit';
import { randomBytes, createHash } from 'node:crypto';
import { ConvexError } from 'convex/values';
import type { ConvexHttpClient } from 'convex/browser';
import { convexClient } from '$lib/server/convex';
import { api } from '$convex/_generated/api';
import type { Id } from '$convex/_generated/dataModel';

/**
 * skol REST API v1 — thin translator between HTTP and Convex functions.
 *
 * Auth (one of):
 * - `Authorization: Bearer skol_…` — API token (for the MCP server / agents).
 *   Identity is resolved inside Convex via the token's stored hash.
 * - Session cookie — same as the web app (handy for the browser/dev).
 *
 * See docs/API.md for the route reference.
 */

type ApiCtx = {
	client: ConvexHttpClient;
	/** Raw API token, passed through to Convex functions (undefined for session auth). */
	apiToken: string | undefined;
	/** Session-authenticated (cookie) request. */
	hasSession: boolean;
	event: RequestEvent;
	params: Record<string, string>;
	body: Record<string, unknown>;
};

type Route = {
	method: string;
	/** Path pattern, e.g. 'events/:id/lists'. */
	pattern: string;
	/** Token management must not be possible with an API token itself. */
	sessionOnly?: boolean;
	handler: (ctx: ApiCtx) => Promise<unknown>;
};

/** Accept ms timestamps or 'YYYY-MM-DD' (interpreted as local noon). */
function toMs(value: unknown, field: string): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [y, m, d] = value.split('-').map(Number);
		return new Date(y, m - 1, d, 12, 0, 0).getTime();
	}
	throw error(400, `${field} must be a ms timestamp or 'YYYY-MM-DD'`);
}

function optMs(value: unknown, field: string): number | undefined {
	return value === undefined || value === null ? undefined : toMs(value, field);
}

function str(value: unknown, field: string): string {
	if (typeof value !== 'string' || !value.trim()) throw error(400, `${field} is required`);
	return value;
}

function optStr(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function optBool(value: unknown, field: string): boolean | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'boolean') throw error(400, `${field} must be a boolean`);
	return value;
}

const routes: Route[] = [
	{
		method: 'GET',
		pattern: 'me',
		handler: async ({ client, apiToken }) => {
			const me = await client.query(api.auth.getCurrentUser, { apiToken });
			if (!me) throw error(401, 'Invalid or revoked token');
			return me;
		}
	},

	// ---- Events ----
	{
		method: 'GET',
		pattern: 'events',
		handler: ({ client, apiToken }) => client.query(api.events.listMine, { apiToken })
	},
	{
		method: 'POST',
		pattern: 'events',
		handler: ({ client, apiToken, body }) =>
			client.mutation(api.events.create, {
				apiToken,
				name: str(body.name, 'name'),
				brief: optStr(body.brief) ?? '',
				startDate: toMs(body.startDate, 'startDate'),
				endDate: toMs(body.endDate, 'endDate')
			})
	},
	{
		method: 'GET',
		pattern: 'events/:id',
		handler: ({ client, apiToken, params }) =>
			client.query(api.events.get, { apiToken, eventId: params.id as Id<'events'> })
	},
	{
		method: 'PATCH',
		pattern: 'events/:id',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.events.update, {
				apiToken,
				eventId: params.id as Id<'events'>,
				name: optStr(body.name),
				brief: optStr(body.brief),
				startDate: optMs(body.startDate, 'startDate'),
				endDate: optMs(body.endDate, 'endDate')
			})
	},
	{
		method: 'DELETE',
		pattern: 'events/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.events.remove, { apiToken, eventId: params.id as Id<'events'> })
	},
	{
		method: 'POST',
		pattern: 'events/:id/duplicate',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.events.duplicate, {
				apiToken,
				eventId: params.id as Id<'events'>,
				name: optStr(body.name),
				startDate: toMs(body.startDate, 'startDate'),
				endDate: toMs(body.endDate, 'endDate')
			})
	},

	// ---- Lists ----
	{
		method: 'GET',
		pattern: 'events/:id/lists',
		handler: ({ client, apiToken, params }) =>
			client.query(api.lists.forEvent, { apiToken, eventId: params.id as Id<'events'> })
	},
	{
		method: 'POST',
		pattern: 'events/:id/lists',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.lists.create, {
				apiToken,
				eventId: params.id as Id<'events'>,
				title: str(body.title, 'title'),
				description: optStr(body.description)
			})
	},
	{
		method: 'PATCH',
		pattern: 'lists/:id',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.lists.update, {
				apiToken,
				listId: params.id as Id<'lists'>,
				title: optStr(body.title),
				description: optStr(body.description)
			})
	},
	{
		method: 'DELETE',
		pattern: 'lists/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.lists.remove, { apiToken, listId: params.id as Id<'lists'> })
	},
	{
		method: 'POST',
		pattern: 'lists/:id/copy',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.lists.copyTo, {
				apiToken,
				listId: params.id as Id<'lists'>,
				targetEventId: str(body.targetEventId, 'targetEventId') as Id<'events'>
			})
	},
	{
		method: 'POST',
		pattern: 'lists/:id/entries',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.lists.addEntry, {
				apiToken,
				listId: params.id as Id<'lists'>,
				title: str(body.title, 'title')
			})
	},

	// ---- Entries & marks ----
	{
		method: 'PATCH',
		pattern: 'entries/:id',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.lists.updateEntry, {
				apiToken,
				entryId: params.id as Id<'listEntries'>,
				title: str(body.title, 'title')
			})
	},
	{
		method: 'DELETE',
		pattern: 'entries/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.lists.removeEntry, {
				apiToken,
				entryId: params.id as Id<'listEntries'>
			})
	},
	{
		method: 'POST',
		pattern: 'entries/:id/mark',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.lists.mark, {
				apiToken,
				entryId: params.id as Id<'listEntries'>,
				comment: optStr(body.comment)
			})
	},
	{
		method: 'DELETE',
		pattern: 'marks/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.lists.unmark, { apiToken, markId: params.id as Id<'entryMarks'> })
	},

	// ---- Pages ----
	{
		method: 'GET',
		pattern: 'events/:id/pages',
		handler: ({ client, apiToken, params }) =>
			client.query(api.pages.forEvent, { apiToken, eventId: params.id as Id<'events'> })
	},
	{
		method: 'POST',
		pattern: 'events/:id/pages',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.pages.create, {
				apiToken,
				eventId: params.id as Id<'events'>,
				title: str(body.title, 'title'),
				content: optStr(body.content) ?? ''
			})
	},
	{
		method: 'PATCH',
		pattern: 'pages/:id',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.pages.update, {
				apiToken,
				pageId: params.id as Id<'pages'>,
				title: optStr(body.title),
				content: optStr(body.content)
			})
	},
	{
		method: 'DELETE',
		pattern: 'pages/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.pages.remove, { apiToken, pageId: params.id as Id<'pages'> })
	},

	// ---- Members ----
	{
		method: 'GET',
		pattern: 'events/:id/members',
		handler: ({ client, apiToken, params }) =>
			client.query(api.members.forEvent, { apiToken, eventId: params.id as Id<'events'> })
	},
	{
		method: 'POST',
		pattern: 'events/:id/members',
		handler: ({ client, apiToken, params, body }) =>
			client.mutation(api.members.add, {
				apiToken,
				eventId: params.id as Id<'events'>,
				email: str(body.email, 'email')
			})
	},
	{
		method: 'PATCH',
		pattern: 'members/:id',
		handler: ({ client, apiToken, params, body }) => {
			const role = body.role;
			if (role !== 'guest' && role !== 'admin') throw error(400, "role must be 'guest' or 'admin'");
			return client.mutation(api.members.setRole, {
				apiToken,
				memberId: params.id as Id<'eventMembers'>,
				role
			});
		}
	},
	{
		method: 'DELETE',
		pattern: 'members/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.members.remove, {
				apiToken,
				memberId: params.id as Id<'eventMembers'>
			})
	},

	// ---- Invites (pending, for emails without an account yet) ----
	{
		method: 'GET',
		pattern: 'events/:id/invites',
		handler: ({ client, apiToken, params }) =>
			client.query(api.members.invitesForEvent, {
				apiToken,
				eventId: params.id as Id<'events'>
			})
	},
	{
		method: 'DELETE',
		pattern: 'invites/:id',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.members.revokeInvite, {
				apiToken,
				inviteId: params.id as Id<'invites'>
			})
	},

	// ---- Notifications ----
	{
		method: 'GET',
		pattern: 'notifications',
		handler: async ({ client, apiToken }) => {
			const [notifications, unreadCount] = await Promise.all([
				client.query(api.notifications.list, { apiToken }),
				client.query(api.notifications.unreadCount, { apiToken })
			]);
			return { notifications, unreadCount };
		}
	},
	{
		method: 'POST',
		pattern: 'notifications/:id/read',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.notifications.markRead, {
				apiToken,
				notificationId: params.id as Id<'notifications'>
			})
	},
	{
		method: 'POST',
		pattern: 'notifications/read-all',
		handler: ({ client, apiToken }) => client.mutation(api.notifications.markAllRead, { apiToken })
	},
	{
		method: 'PATCH',
		pattern: 'me/settings',
		handler: ({ client, apiToken, body }) =>
			client.mutation(api.notifications.updateSettings, {
				apiToken,
				notifyInApp: optBool(body.notifyInApp, 'notifyInApp'),
				notifyEmail: optBool(body.notifyEmail, 'notifyEmail')
			})
	},

	// ---- App admin ----
	{
		method: 'GET',
		pattern: 'users',
		handler: ({ client, apiToken }) => client.query(api.admin.listUsers, { apiToken })
	},
	{
		method: 'PATCH',
		pattern: 'users/:id',
		handler: ({ client, apiToken, params, body }) => {
			if (typeof body.isAppAdmin !== 'boolean') throw error(400, 'isAppAdmin must be a boolean');
			return client.mutation(api.admin.setAppAdmin, {
				apiToken,
				userId: params.id as Id<'users'>,
				isAppAdmin: body.isAppAdmin
			});
		}
	},
	{
		method: 'DELETE',
		pattern: 'users/:id/participation',
		handler: ({ client, apiToken, params }) =>
			client.mutation(api.admin.removeUserParticipation, {
				apiToken,
				userId: params.id as Id<'users'>
			})
	},

	// ---- API tokens (session-only: a token must not manage tokens) ----
	{
		method: 'GET',
		pattern: 'tokens',
		sessionOnly: true,
		handler: ({ client }) => client.query(api.apiTokens.listMine, {})
	},
	{
		method: 'POST',
		pattern: 'tokens',
		sessionOnly: true,
		handler: async ({ client, body }) => {
			const name = str(body.name, 'name');
			const token = `skol_${randomBytes(32).toString('base64url')}`;
			const tokenHash = createHash('sha256').update(token).digest('hex');
			const prefix = token.slice(0, 10);
			const tokenId = await client.mutation(api.apiTokens.create, { name, tokenHash, prefix });
			// The raw token is returned exactly once and never stored.
			return { tokenId, name, token };
		}
	},
	{
		method: 'DELETE',
		pattern: 'tokens/:id',
		sessionOnly: true,
		handler: ({ client, params }) =>
			client.mutation(api.apiTokens.revoke, { tokenId: params.id as Id<'apiTokens'> })
	}
];

function matchRoute(method: string, path: string) {
	const segments = path.split('/').filter(Boolean);
	outer: for (const route of routes) {
		if (route.method !== method) continue;
		const parts = route.pattern.split('/');
		if (parts.length !== segments.length) continue;
		const params: Record<string, string> = {};
		for (let i = 0; i < parts.length; i++) {
			if (parts[i].startsWith(':')) params[parts[i].slice(1)] = segments[i];
			else if (parts[i] !== segments[i]) continue outer;
		}
		return { route, params };
	}
	return null;
}

function mapConvexError(e: unknown): never {
	if (e instanceof ConvexError) {
		const message = typeof e.data === 'string' ? e.data : 'Request failed';
		if (message === 'Not signed in') throw error(401, message);
		if (message.includes('required') || message.includes('Not a member')) throw error(403, message);
		if (message.includes('not found') || message.includes('Not found')) throw error(404, message);
		throw error(400, message);
	}
	if (e instanceof Error && e.message.includes('ArgumentValidationError')) {
		throw error(400, 'Invalid arguments');
	}
	throw e;
}

async function handle(event: RequestEvent): Promise<Response> {
	const { request, params, locals } = event;
	const path = params.path ?? '';
	const matched = matchRoute(request.method, path);
	if (!matched) throw error(404, 'Unknown endpoint');

	const authHeader = request.headers.get('authorization');
	const apiToken = authHeader?.match(/^Bearer\s+(skol_[A-Za-z0-9_-]+)$/)?.[1];
	const hasSession = !!locals.token;
	if (!apiToken && !hasSession) {
		throw error(401, 'Provide an API token (Authorization: Bearer skol_…) or sign in');
	}
	if (matched.route.sessionOnly && !hasSession) {
		throw error(403, 'This endpoint requires a browser session');
	}

	// Session requests run with the user's Convex JWT; token requests run
	// unauthenticated — identity is resolved from apiToken inside Convex.
	const client = convexClient(apiToken ? undefined : (locals.token ?? undefined));

	let body: Record<string, unknown> = {};
	if (request.method !== 'GET' && request.method !== 'DELETE') {
		body = await request.json().catch(() => ({}));
	}

	try {
		const result = await matched.route.handler({
			client,
			apiToken,
			hasSession,
			event,
			params: matched.params,
			body
		});
		return json({ ok: true, data: result ?? null });
	} catch (e) {
		mapConvexError(e);
	}
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
