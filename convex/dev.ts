import { ConvexError, v } from 'convex/values';
import { internalMutation } from './_generated/server';

/**
 * Break-glass admin bootstrap, runnable only via CLI/dashboard (internal):
 *
 *   npx convex run dev:setAppAdminByEmail '{"email":"you@example.com","isAppAdmin":true}'
 *
 * Useful when no app admin exists yet (e.g. fresh deployment) or the last
 * admin locked themselves out.
 */
export const setAppAdminByEmail = internalMutation({
	args: { email: v.string(), isAppAdmin: v.boolean() },
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query('users')
			.withIndex('by_email', (q) => q.eq('email', args.email.trim().toLowerCase()))
			.unique();
		if (!user) throw new ConvexError(`No user with email ${args.email}`);
		await ctx.db.patch(user._id, { isAppAdmin: args.isAppAdmin });
		return { userId: user._id, name: user.name, isAppAdmin: args.isAppAdmin };
	}
});
