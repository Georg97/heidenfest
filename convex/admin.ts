import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAppAdmin } from './access';

const apiToken = v.optional(v.string());

/** All registered users (app admin only). */
export const listUsers = query({
	args: { apiToken },
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx, args.apiToken);
		return await ctx.db.query('users').collect();
	}
});

export const setAppAdmin = mutation({
	args: { userId: v.id('users'), isAppAdmin: v.boolean(), apiToken },
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx, args.apiToken);
		if (admin._id === args.userId && !args.isAppAdmin) {
			throw new ConvexError('You cannot revoke your own admin rights');
		}
		await ctx.db.patch(args.userId, { isAppAdmin: args.isAppAdmin });
	}
});

/**
 * Strip a user's participation: all event memberships and marks are deleted.
 * The account itself stays intact (full account deletion is a dashboard
 * operation) — they can be re-invited to events later.
 */
export const removeUserParticipation = mutation({
	args: { userId: v.id('users'), apiToken },
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx, args.apiToken);
		if (admin._id === args.userId) throw new ConvexError('You cannot remove yourself');
		const memberships = await ctx.db
			.query('eventMembers')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.collect();
		for (const m of memberships) await ctx.db.delete(m._id);
		// Marks have no by_user index (rarely needed); full scan is fine at this scale.
		const marks = await ctx.db.query('entryMarks').collect();
		for (const mark of marks) {
			if (mark.userId === args.userId) await ctx.db.delete(mark._id);
		}
	}
});
