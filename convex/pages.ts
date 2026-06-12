import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireEventAdmin, requireEventMember } from './access';
import { notifyEventMembers } from './notifications';

const apiToken = v.optional(v.string());

async function adminPage(ctx: MutationCtx, pageId: Id<'pages'>, token?: string) {
	const page = await ctx.db.get(pageId);
	if (!page) throw new ConvexError('Page not found');
	const { user } = await requireEventAdmin(ctx, page.eventId, token);
	return { page, user };
}

export const forEvent = query({
	args: { eventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		await requireEventMember(ctx, args.eventId, args.apiToken);
		return await ctx.db
			.query('pages')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect();
	}
});

export const create = mutation({
	args: { eventId: v.id('events'), title: v.string(), content: v.string(), apiToken },
	handler: async (ctx, { apiToken: token, ...fields }) => {
		const { user, event } = await requireEventAdmin(ctx, fields.eventId, token);
		const pageId = await ctx.db.insert('pages', {
			...fields,
			updatedBy: user._id,
			updatedAt: Date.now()
		});
		await notifyEventMembers(ctx, fields.eventId, user._id, {
			type: 'page_created',
			eventId: fields.eventId,
			title: `Neue Infoseite „${fields.title}“ bei „${event.name}“`
		});
		return pageId;
	}
});

export const update = mutation({
	args: {
		pageId: v.id('pages'),
		title: v.optional(v.string()),
		content: v.optional(v.string()),
		apiToken
	},
	handler: async (ctx, { pageId, apiToken: token, ...fields }) => {
		const { user } = await adminPage(ctx, pageId, token);
		await ctx.db.patch(pageId, { ...fields, updatedBy: user._id, updatedAt: Date.now() });
	}
});

export const remove = mutation({
	args: { pageId: v.id('pages'), apiToken },
	handler: async (ctx, args) => {
		await adminPage(ctx, args.pageId, args.apiToken);
		await ctx.db.delete(args.pageId);
	}
});
