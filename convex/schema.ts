import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	// App-level mirror of Better Auth users (kept in sync via triggers in auth.ts).
	// App-wide roles live here; per-event roles live in eventMembers.
	users: defineTable({
		authId: v.string(),
		name: v.string(),
		email: v.string(),
		image: v.optional(v.string()),
		isAppAdmin: v.boolean(),
		// Notification settings. Missing = default: in-app on, email off.
		notifyInApp: v.optional(v.boolean()),
		notifyEmail: v.optional(v.boolean())
	})
		.index('by_authId', ['authId'])
		.index('by_email', ['email']),

	// The main entity. Dates are ms epoch timestamps.
	events: defineTable({
		name: v.string(),
		brief: v.string(),
		startDate: v.number(),
		endDate: v.number(),
		imageKey: v.optional(v.string()),
		createdBy: v.id('users')
	}),

	// Guests and event admins. The creator is inserted as the first admin.
	eventMembers: defineTable({
		eventId: v.id('events'),
		userId: v.id('users'),
		role: v.union(v.literal('guest'), v.literal('admin'))
	})
		.index('by_event', ['eventId'])
		.index('by_user', ['userId'])
		.index('by_event_user', ['eventId', 'userId']),

	// Resource lists ("who brings what"). Ordered by creation time.
	lists: defineTable({
		eventId: v.id('events'),
		title: v.string(),
		description: v.optional(v.string())
	}).index('by_event', ['eventId']),

	listEntries: defineTable({
		listId: v.id('lists'),
		title: v.string()
	}).index('by_list', ['listId']),

	// A user marking an entry ("I bring this"), optionally with a comment.
	// Multiple users may mark the same entry.
	entryMarks: defineTable({
		entryId: v.id('listEntries'),
		userId: v.id('users'),
		comment: v.optional(v.string())
	})
		.index('by_entry', ['entryId'])
		.index('by_entry_user', ['entryId', 'userId']),

	// Markdown info pages per event. Ordered by creation time.
	pages: defineTable({
		eventId: v.id('events'),
		title: v.string(),
		content: v.string(),
		updatedBy: v.id('users'),
		updatedAt: v.number()
	}).index('by_event', ['eventId']),

	// Pending invitations for people without an account yet (by email, lowercase).
	// Claimed on first sign-up: membership is created, the invite deleted.
	invites: defineTable({
		eventId: v.id('events'),
		email: v.string(),
		invitedBy: v.id('users')
	})
		.index('by_email', ['email'])
		.index('by_event', ['eventId'])
		.index('by_event_email', ['eventId', 'email']),

	// In-app notifications. Email delivery happens at creation time via the
	// scheduler (email.ts); these rows are only the in-app copies.
	notifications: defineTable({
		userId: v.id('users'),
		type: v.string(), // 'invite' | 'event_updated' | 'list_created' | 'page_created'
		title: v.string(),
		body: v.optional(v.string()),
		eventId: v.optional(v.id('events')),
		read: v.boolean()
	})
		.index('by_user', ['userId'])
		.index('by_user_read', ['userId', 'read'])
		.index('by_event', ['eventId']),

	// API tokens for the REST API / MCP server. Only the SHA-256 hash is stored;
	// the raw token (skol_…) is shown once at mint time.
	apiTokens: defineTable({
		userId: v.id('users'),
		name: v.string(),
		tokenHash: v.string(),
		prefix: v.string()
	})
		.index('by_hash', ['tokenHash'])
		.index('by_user', ['userId'])
});
