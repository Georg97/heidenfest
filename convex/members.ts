import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireEventAdmin, requireEventMember } from './access';
import { inviteEmail } from './email';
import { notify } from './notifications';

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

/**
 * Invite someone by email. Registered users are added as guests right away
 * (and notified); unknown emails get a pending invite + invitation email and
 * join automatically when they sign up with that address.
 */
export const add = mutation({
	args: { eventId: v.id('events'), email: v.string(), apiToken },
	handler: async (ctx, args) => {
		const { user: inviter, event } = await requireEventAdmin(ctx, args.eventId, args.apiToken);
		const email = args.email.trim().toLowerCase();
		if (!/^\S+@\S+\.\S+$/.test(email)) throw new ConvexError('Invalid email address');

		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', email))
			.unique();

		if (user) {
			const existing = await ctx.db
				.query('eventMembers')
				.withIndex('by_event_user', (q) => q.eq('eventId', args.eventId).eq('userId', user._id))
				.unique();
			if (existing) throw new ConvexError('Already a member');
			await ctx.db.insert('eventMembers', {
				eventId: args.eventId,
				userId: user._id,
				role: 'guest'
			});
			await notify(ctx, user, {
				type: 'invite',
				eventId: args.eventId,
				title: `Du bist jetzt bei „${event.name}“ dabei`,
				body: `${inviter.name} hat dich eingeladen.`
			});
			return { status: 'added' as const };
		}

		const pending = await ctx.db
			.query('invites')
			.withIndex('by_event_email', (q) => q.eq('eventId', args.eventId).eq('email', email))
			.unique();
		if (pending) throw new ConvexError('Already invited');
		await ctx.db.insert('invites', {
			eventId: args.eventId,
			email,
			invitedBy: inviter._id
		});
		const { subject, html } = inviteEmail({ inviterName: inviter.name, eventName: event.name });
		await ctx.scheduler.runAfter(0, internal.email.send, { to: email, subject, html });
		return { status: 'invited' as const };
	}
});

/** Pending email invites of an event. Empty for non-admins (nothing to manage). */
export const invitesForEvent = query({
	args: { eventId: v.id('events'), apiToken },
	handler: async (ctx, args) => {
		const { role } = await requireEventMember(ctx, args.eventId, args.apiToken);
		if (role !== 'admin') return [];
		return await ctx.db
			.query('invites')
			.withIndex('by_event', (q) => q.eq('eventId', args.eventId))
			.collect();
	}
});

export const revokeInvite = mutation({
	args: { inviteId: v.id('invites'), apiToken },
	handler: async (ctx, args) => {
		const invite = await ctx.db.get(args.inviteId);
		if (!invite) return;
		await requireEventAdmin(ctx, invite.eventId, args.apiToken);
		await ctx.db.delete(args.inviteId);
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
