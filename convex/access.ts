import { ConvexError } from 'convex/values';
import { sha256 } from 'js-sha256';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { authComponent } from './auth';

type Ctx = QueryCtx | MutationCtx;

export type EventRole = 'guest' | 'admin';

/**
 * Resolve the acting user. Two auth paths:
 * - Web app: Better Auth session (ctx.auth via Convex JWT).
 * - REST API / MCP: an `apiToken` argument (skol_…), verified against its
 *   stored SHA-256 hash.
 */
export async function currentUser(ctx: Ctx, apiToken?: string): Promise<Doc<'users'> | null> {
	if (apiToken) {
		const token = await ctx.db
			.query('apiTokens')
			.withIndex('by_hash', (q) => q.eq('tokenHash', sha256(apiToken)))
			.unique();
		if (!token) return null;
		return await ctx.db.get(token.userId);
	}
	const authUser = await authComponent.safeGetAuthUser(ctx);
	if (!authUser) return null;
	return await ctx.db
		.query('users')
		.withIndex('by_authId', (q) => q.eq('authId', authUser._id))
		.unique();
}

export async function requireUser(ctx: Ctx, apiToken?: string): Promise<Doc<'users'>> {
	const user = await currentUser(ctx, apiToken);
	if (!user) throw new ConvexError('Not signed in');
	return user;
}

export async function requireAppAdmin(ctx: Ctx, apiToken?: string): Promise<Doc<'users'>> {
	const user = await requireUser(ctx, apiToken);
	if (!user.isAppAdmin) throw new ConvexError('App admin required');
	return user;
}

export async function membershipOf(
	ctx: Ctx,
	userId: Id<'users'>,
	eventId: Id<'events'>
): Promise<Doc<'eventMembers'> | null> {
	return await ctx.db
		.query('eventMembers')
		.withIndex('by_event_user', (q) => q.eq('eventId', eventId).eq('userId', userId))
		.unique();
}

/** Role of a user in an event. App admins act as event admins everywhere. */
export async function eventRoleOf(
	ctx: Ctx,
	user: Doc<'users'>,
	eventId: Id<'events'>
): Promise<EventRole | null> {
	if (user.isAppAdmin) return 'admin';
	const membership = await membershipOf(ctx, user._id, eventId);
	return membership?.role ?? null;
}

export async function requireEventMember(
	ctx: Ctx,
	eventId: Id<'events'>,
	apiToken?: string
): Promise<{ user: Doc<'users'>; role: EventRole; event: Doc<'events'> }> {
	const user = await requireUser(ctx, apiToken);
	const event = await ctx.db.get(eventId);
	if (!event) throw new ConvexError('Event not found');
	const role = await eventRoleOf(ctx, user, eventId);
	if (!role) throw new ConvexError('Not a member of this event');
	return { user, role, event };
}

export async function requireEventAdmin(
	ctx: Ctx,
	eventId: Id<'events'>,
	apiToken?: string
): Promise<{ user: Doc<'users'>; event: Doc<'events'> }> {
	const { user, role, event } = await requireEventMember(ctx, eventId, apiToken);
	if (role !== 'admin') throw new ConvexError('Event admin required');
	return { user, event };
}
