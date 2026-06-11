import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { requireEventAdmin, requireEventMember, requireUser } from './access';
import { cascadeDeleteList, copyListInto } from './events';

const apiToken = v.optional(v.string());

/** Resolve a list and authorize the caller as member (or admin) of its event. */
async function memberList(
	ctx: QueryCtx | MutationCtx,
	listId: Doc<'lists'>['_id'],
	token?: string
) {
	const list = await ctx.db.get(listId);
	if (!list) throw new ConvexError('List not found');
	const { user, role } = await requireEventMember(ctx, list.eventId, token);
	return { list, user, role };
}

async function adminList(ctx: MutationCtx, listId: Doc<'lists'>['_id'], token?: string) {
	const { list, user, role } = await memberList(ctx, listId, token);
	if (role !== 'admin') throw new ConvexError('Event admin required');
	return { list, user };
}

/** All lists of an event with entries and marks (incl. who marked). */
export const forEvent = query({
	args: { eventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		await requireEventMember(ctx, args.eventId, args.apiToken);
		const lists = await ctx.db
			.query('lists')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect();

		return await Promise.all(
			lists.map(async (list) => {
				const entries = await ctx.db
					.query('listEntries')
					.withIndex('by_list', (q) => q.eq('listId', list._id))
					.collect();
				const entriesWithMarks = await Promise.all(
					entries.map(async (entry) => {
						const marks = await ctx.db
							.query('entryMarks')
							.withIndex('by_entry', (q) => q.eq('entryId', entry._id))
							.collect();
						const marksWithUsers = await Promise.all(
							marks.map(async (mark) => {
								const user = await ctx.db.get(mark.userId);
								return {
									_id: mark._id,
									userId: mark.userId,
									comment: mark.comment,
									userName: user?.name ?? 'Unbekannt',
									userImage: user?.image
								};
							})
						);
						return { ...entry, marks: marksWithUsers };
					})
				);
				return { ...list, entries: entriesWithMarks };
			})
		);
	}
});

export const create = mutation({
	args: {
		eventId: v.id('events'),
		title: v.string(),
		description: v.optional(v.string()),
		apiToken
	},
	handler: async (ctx, { apiToken: token, ...fields }) => {
		await requireEventAdmin(ctx, fields.eventId, token);
		return await ctx.db.insert('lists', fields);
	}
});

export const update = mutation({
	args: {
		listId: v.id('lists'),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		apiToken
	},
	handler: async (ctx, { listId, apiToken: token, ...fields }) => {
		await adminList(ctx, listId, token);
		await ctx.db.patch(listId, fields);
	}
});

export const remove = mutation({
	args: { listId: v.id('lists'), apiToken },
	handler: async (ctx, args) => {
		await adminList(ctx, args.listId, args.apiToken);
		await cascadeDeleteList(ctx, args.listId);
	}
});

/**
 * Raw copy of a list (entries, no marks) into another event.
 * Caller must be member of the source event and admin of the target event.
 */
export const copyTo = mutation({
	args: { listId: v.id('lists'), targetEventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		const { list } = await memberList(ctx, args.listId, args.apiToken);
		await requireEventAdmin(ctx, args.targetEventId, args.apiToken);
		return await copyListInto(ctx, list, args.targetEventId);
	}
});

export const addEntry = mutation({
	args: { listId: v.id('lists'), title: v.string(), apiToken },
	handler: async (ctx, args) => {
		await adminList(ctx, args.listId, args.apiToken);
		return await ctx.db.insert('listEntries', { listId: args.listId, title: args.title });
	}
});

export const updateEntry = mutation({
	args: { entryId: v.id('listEntries'), title: v.string(), apiToken },
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.entryId);
		if (!entry) throw new ConvexError('Entry not found');
		await adminList(ctx, entry.listId, args.apiToken);
		await ctx.db.patch(args.entryId, { title: args.title });
	}
});

export const removeEntry = mutation({
	args: { entryId: v.id('listEntries'), apiToken },
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.entryId);
		if (!entry) throw new ConvexError('Entry not found');
		await adminList(ctx, entry.listId, args.apiToken);
		const marks = await ctx.db
			.query('entryMarks')
			.withIndex('by_entry', (q) => q.eq('entryId', args.entryId))
			.collect();
		for (const mark of marks) await ctx.db.delete(mark._id);
		await ctx.db.delete(args.entryId);
	}
});

/** Put my name on an entry ("I bring this"), optionally with a comment. */
export const mark = mutation({
	args: { entryId: v.id('listEntries'), comment: v.optional(v.string()), apiToken },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx, args.apiToken);
		const entry = await ctx.db.get(args.entryId);
		if (!entry) throw new ConvexError('Entry not found');
		await memberList(ctx, entry.listId, args.apiToken);
		const existing = await ctx.db
			.query('entryMarks')
			.withIndex('by_entry_user', (q) => q.eq('entryId', args.entryId).eq('userId', user._id))
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, { comment: args.comment });
			return existing._id;
		}
		return await ctx.db.insert('entryMarks', {
			entryId: args.entryId,
			userId: user._id,
			comment: args.comment
		});
	}
});

/** Remove a mark. Users remove their own; event admins can remove any. */
export const unmark = mutation({
	args: { markId: v.id('entryMarks'), apiToken },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx, args.apiToken);
		const mark = await ctx.db.get(args.markId);
		if (!mark) return;
		const entry = await ctx.db.get(mark.entryId);
		if (!entry) throw new ConvexError('Entry not found');
		const { role } = await memberList(ctx, entry.listId, args.apiToken);
		if (mark.userId !== user._id && role !== 'admin') {
			throw new ConvexError('Can only remove your own mark');
		}
		await ctx.db.delete(args.markId);
	}
});
