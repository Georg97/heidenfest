import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import {
	currentUser,
	requireEventAdmin,
	requireEventMember,
	requireUser
} from './access';
import { notifyEventMembers } from './notifications';

// All functions accept an optional apiToken so the REST API / MCP can act
// as the token's user; the web app authenticates via session instead.
const apiToken = v.optional(v.string());

/** Events visible to the current user, with their role. App admins see all. */
export const listMine = query({
	args: { apiToken },
	handler: async (ctx, args) => {
		const user = await currentUser(ctx, args.apiToken);
		if (!user) return [];

		if (user.isAppAdmin) {
			const events = await ctx.db.query('events').collect();
			return events
				.map((event) => ({ ...event, role: 'admin' as const }))
				.sort((a, b) => b.startDate - a.startDate);
		}

		const memberships = await ctx.db
			.query('eventMembers')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();
		const events = await Promise.all(
			memberships.map(async (m) => {
				const event = await ctx.db.get(m.eventId);
				return event ? { ...event, role: m.role } : null;
			})
		);
		return events
			.filter((e): e is NonNullable<typeof e> => e !== null)
			.sort((a, b) => b.startDate - a.startDate);
	}
});

export const get = query({
	args: { eventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		const { event, role } = await requireEventMember(ctx, args.eventId, args.apiToken);
		return { ...event, role };
	}
});

export const create = mutation({
	args: {
		name: v.string(),
		brief: v.string(),
		startDate: v.number(),
		endDate: v.number(),
		imageKey: v.optional(v.string()),
		apiToken
	},
	handler: async (ctx, { apiToken: token, ...fields }) => {
		const user = await requireUser(ctx, token);
		if (fields.endDate < fields.startDate) throw new ConvexError('End date before start date');
		const eventId = await ctx.db.insert('events', { ...fields, createdBy: user._id });
		// The creator is the first event admin.
		await ctx.db.insert('eventMembers', { eventId, userId: user._id, role: 'admin' });
		return eventId;
	}
});

export const update = mutation({
	args: {
		eventId: v.id('events'),
		name: v.optional(v.string()),
		brief: v.optional(v.string()),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		imageKey: v.optional(v.string()),
		apiToken
	},
	handler: async (ctx, { eventId, apiToken: token, ...fields }) => {
		const { user, event } = await requireEventAdmin(ctx, eventId, token);
		const next = { ...event, ...fields };
		if (next.endDate < next.startDate) throw new ConvexError('End date before start date');
		await ctx.db.patch(eventId, fields);
		await notifyEventMembers(ctx, eventId, user._id, {
			type: 'event_updated',
			eventId,
			title: `„${next.name}“ wurde aktualisiert`
		});
	}
});

export const remove = mutation({
	args: { eventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		await requireEventAdmin(ctx, args.eventId, args.apiToken);
		await cascadeDeleteEvent(ctx, args.eventId);
	}
});

/**
 * Duplicate an event (sequel): copies fields, lists, entries and pages.
 * Marks and members are NOT copied. The caller picks the new timeframe
 * (keeping the old one is allowed) and becomes creator + first admin.
 */
export const duplicate = mutation({
	args: {
		eventId: v.id('events'),
		name: v.optional(v.string()),
		startDate: v.number(),
		endDate: v.number(),
		apiToken
	},
	handler: async (ctx, args) => {
		const { user, event } = await requireEventAdmin(ctx, args.eventId, args.apiToken);
		if (args.endDate < args.startDate) throw new ConvexError('End date before start date');

		const newEventId = await ctx.db.insert('events', {
			name: args.name ?? event.name,
			brief: event.brief,
			startDate: args.startDate,
			endDate: args.endDate,
			imageKey: event.imageKey,
			createdBy: user._id
		});
		await ctx.db.insert('eventMembers', { eventId: newEventId, userId: user._id, role: 'admin' });

		const lists = await ctx.db
			.query('lists')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect();
		for (const list of lists) {
			await copyListInto(ctx, list, newEventId);
		}

		const pages = await ctx.db
			.query('pages')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect();
		for (const page of pages) {
			await ctx.db.insert('pages', {
				eventId: newEventId,
				title: page.title,
				content: page.content,
				updatedBy: user._id,
				updatedAt: Date.now()
			});
		}

		return newEventId;
	}
});

/** Raw copy of a list and its entries (no marks) into an event. */
export async function copyListInto(
	ctx: MutationCtx,
	list: Doc<'lists'>,
	targetEventId: Id<'events'>
): Promise<Id<'lists'>> {
	const newListId = await ctx.db.insert('lists', {
		eventId: targetEventId,
		title: list.title,
		description: list.description
	});
	const entries = await ctx.db
		.query('listEntries')
		.withIndex('by_list', (q) => q.eq('listId', list._id))
		.collect();
	for (const entry of entries) {
		await ctx.db.insert('listEntries', { listId: newListId, title: entry.title });
	}
	return newListId;
}

export async function cascadeDeleteEvent(ctx: MutationCtx, eventId: Id<'events'>) {
	const lists = await ctx.db
		.query('lists')
		.withIndex('by_event', (q) => q.eq('eventId', eventId))
		.collect();
	for (const list of lists) {
		await cascadeDeleteList(ctx, list._id);
	}
	const pages = await ctx.db
		.query('pages')
		.withIndex('by_event', (q) => q.eq('eventId', eventId))
		.collect();
	for (const page of pages) await ctx.db.delete(page._id);
	const members = await ctx.db
		.query('eventMembers')
		.withIndex('by_event', (q) => q.eq('eventId', eventId))
		.collect();
	for (const member of members) await ctx.db.delete(member._id);
	const invites = await ctx.db
		.query('invites')
		.withIndex('by_event', (q) => q.eq('eventId', eventId))
		.collect();
	for (const invite of invites) await ctx.db.delete(invite._id);
	const notifications = await ctx.db
		.query('notifications')
		.withIndex('by_event', (q) => q.eq('eventId', eventId))
		.collect();
	for (const notification of notifications) await ctx.db.delete(notification._id);
	await ctx.db.delete(eventId);
}

export async function cascadeDeleteList(ctx: MutationCtx, listId: Id<'lists'>) {
	const entries = await ctx.db
		.query('listEntries')
		.withIndex('by_list', (q) => q.eq('listId', listId))
		.collect();
	for (const entry of entries) {
		const marks = await ctx.db
			.query('entryMarks')
			.withIndex('by_entry', (q) => q.eq('entryId', entry._id))
			.collect();
		for (const mark of marks) await ctx.db.delete(mark._id);
		await ctx.db.delete(entry._id);
	}
	await ctx.db.delete(listId);
}
