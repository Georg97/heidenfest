import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { requireUser } from './access';
import { notificationEmail } from './email';

const apiToken = v.optional(v.string());

export type NotificationPayload = {
	type: 'invite' | 'event_updated' | 'list_created' | 'page_created';
	title: string;
	body?: string;
	eventId?: Id<'events'>;
};

/**
 * Deliver a notification to one user, honoring their settings:
 * in-app row (default on), email via scheduler (default off).
 */
export async function notify(
	ctx: MutationCtx,
	recipient: Doc<'users'>,
	payload: NotificationPayload
) {
	if (recipient.notifyInApp ?? true) {
		await ctx.db.insert('notifications', { userId: recipient._id, read: false, ...payload });
	}
	if (recipient.notifyEmail ?? false) {
		const { subject, html } = notificationEmail({
			title: payload.title,
			body: payload.body,
			eventId: payload.eventId
		});
		await ctx.scheduler.runAfter(0, internal.email.send, {
			to: recipient.email,
			subject,
			html
		});
	}
}

/** Notify all members of an event except the acting user. */
export async function notifyEventMembers(
	ctx: MutationCtx,
	eventId: Id<'events'>,
	exceptUserId: Id<'users'>,
	payload: NotificationPayload
) {
	const members = await ctx.db
		.query('eventMembers')
		.withIndex('by_event', (q) => q.eq('eventId', eventId))
		.collect();
	for (const member of members) {
		if (member.userId === exceptUserId) continue;
		const user = await ctx.db.get(member.userId);
		if (user) await notify(ctx, user, payload);
	}
}

/** Latest notifications for the current user, newest first. */
export const list = query({
	args: { apiToken },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx, args.apiToken);
		const notifications = await ctx.db
			.query('notifications')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.order('desc')
			.take(50);
		return await Promise.all(
			notifications.map(async (n) => ({
				...n,
				eventName: n.eventId ? (await ctx.db.get(n.eventId))?.name : undefined
			}))
		);
	}
});

export const unreadCount = query({
	args: { apiToken },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx, args.apiToken);
		const unread = await ctx.db
			.query('notifications')
			.withIndex('by_user_read', (q) => q.eq('userId', user._id).eq('read', false))
			.take(100);
		return unread.length;
	}
});

export const markRead = mutation({
	args: { notificationId: v.id('notifications'), apiToken },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx, args.apiToken);
		const notification = await ctx.db.get(args.notificationId);
		if (!notification) return;
		if (notification.userId !== user._id) throw new ConvexError('Not your notification');
		await ctx.db.patch(args.notificationId, { read: true });
	}
});

export const markAllRead = mutation({
	args: { apiToken },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx, args.apiToken);
		const unread = await ctx.db
			.query('notifications')
			.withIndex('by_user_read', (q) => q.eq('userId', user._id).eq('read', false))
			.collect();
		for (const notification of unread) {
			await ctx.db.patch(notification._id, { read: true });
		}
	}
});

export const updateSettings = mutation({
	args: {
		notifyInApp: v.optional(v.boolean()),
		notifyEmail: v.optional(v.boolean()),
		apiToken
	},
	handler: async (ctx, { apiToken: token, ...settings }) => {
		const user = await requireUser(ctx, token);
		await ctx.db.patch(user._id, settings);
	}
});
