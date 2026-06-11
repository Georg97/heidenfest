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
		isAppAdmin: v.boolean()
	})
		.index('by_authId', ['authId'])
		.index('by_email', ['email'])
});
