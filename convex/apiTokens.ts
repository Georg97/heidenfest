import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './access';

// API token management is session-only by design: an API token must not be
// able to mint or revoke tokens, so none of these accept apiToken.

/** My tokens (without hashes). */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		const tokens = await ctx.db
			.query('apiTokens')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();
		return tokens.map(({ tokenHash: _hash, ...token }) => token);
	}
});

/**
 * Store a freshly minted token's hash. The raw token is generated in the
 * SvelteKit server (Node crypto) and never stored.
 */
export const create = mutation({
	args: { name: v.string(), tokenHash: v.string(), prefix: v.string() },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		if (!args.name.trim()) throw new ConvexError('Token name required');
		return await ctx.db.insert('apiTokens', {
			userId: user._id,
			name: args.name.trim(),
			tokenHash: args.tokenHash,
			prefix: args.prefix
		});
	}
});

export const revoke = mutation({
	args: { tokenId: v.id('apiTokens') },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const token = await ctx.db.get(args.tokenId);
		if (!token) return;
		if (token.userId !== user._id && !user.isAppAdmin) {
			throw new ConvexError('Not your token');
		}
		await ctx.db.delete(args.tokenId);
	}
});
