import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireEventAdmin, requireEventMember } from './access';

const apiToken = v.optional(v.string());

/** Members of an event with user info. */
export const forEvent = query({
	args: { eventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		await requireEventMember(ctx, args.eventId, args.apiToken);
		const members = await ctx.db
			.query('eventMembers')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect();
		const withUsers = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId);
				if (!user) return null;
				return {
					_id: member._id,
					userId: member.userId,
					role: member.role,
					name: user.name,
					email: user.email,
					image: user.image
				};
			})
		);
		return withUsers.filter((m): m is NonNullable<typeof m> => m !== null);
	}
});

/** Add a registered user as guest by email. */
export const add = mutation({
	args: { eventId: v.id('events'), email: v.string(), apiToken },
	handler: async (ctx, args) => {
		await requireEventAdmin(ctx, args.eventId, args.apiToken);
		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', args.email.trim().toLowerCase()))
			.unique();
		if (!user) throw new ConvexError('No user with this email — they need to sign up first');
		const existing = await ctx.db
			.query('eventMembers')
			.withIndex('by_event_user', (q) => q.eq('eventId', args.eventId).eq('userId', user._id))
			.unique();
		if (existing) throw new ConvexError('Already a member');
		return await ctx.db.insert('eventMembers', {
			eventId: args.eventId,
			userId: user._id,
			role: 'guest'
		});
	}
});

/** Promote a guest to event admin or demote an admin to guest. */
export const setRole = mutation({
	args: {
		memberId: v.id('eventMembers'),
		role: v.union(v.literal('guest'), v.literal('admin')),
		apiToken
	},
	handler: async (ctx, args) => {
		const member = await ctx.db.get(args.memberId);
		if (!member) throw new ConvexError('Member not found');
		await requireEventAdmin(ctx, member.eventId, args.apiToken);
		await ctx.db.patch(args.memberId, { role: args.role });
	}
});

export const remove = mutation({
	args: { memberId: v.id('eventMembers'), apiToken },
	handler: async (ctx, args) => {
		const member = await ctx.db.get(args.memberId);
		if (!member) return;
		const { user } = await requireEventAdmin(ctx, member.eventId, args.apiToken);
		if (member.userId === user._id) {
			throw new ConvexError('You cannot remove yourself — another admin must do that');
		}
		await ctx.db.delete(args.memberId);
	}
});
