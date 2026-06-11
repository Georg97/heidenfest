import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { v } from 'convex/values';
import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import { currentUser } from './access';
import authConfig from './auth.config';

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, authUser) => {
				// First user to ever sign up becomes app admin (bootstrap).
				const anyUser = await ctx.db.query('users').first();
				await ctx.db.insert('users', {
					authId: authUser._id,
					name: authUser.name,
					email: authUser.email,
					image: authUser.image ?? undefined,
					isAppAdmin: anyUser === null
				});
			},
			onUpdate: async (ctx, newDoc) => {
				const user = await ctx.db
					.query('users')
					.withIndex('by_authId', (q) => q.eq('authId', newDoc._id))
					.unique();
				if (user) {
					await ctx.db.patch(user._id, {
						name: newDoc.name,
						email: newDoc.email,
						image: newDoc.image ?? undefined
					});
				}
			},
			onDelete: async (ctx, authUser) => {
				const user = await ctx.db
					.query('users')
					.withIndex('by_authId', (q) => q.eq('authId', authUser._id))
					.unique();
				if (user) {
					await ctx.db.delete(user._id);
				}
			}
		}
	}
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

const siteUrl = process.env.SITE_URL!;

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID as string,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
			}
		},
		plugins: [convex({ authConfig })]
	});

// Current app user (mirror row incl. isAppAdmin), or null when signed out.
// Accepts an apiToken so the REST API / MCP can resolve "me".
export const getCurrentUser = query({
	args: { apiToken: v.optional(v.string()) },
	handler: async (ctx, args) => {
		return await currentUser(ctx, args.apiToken);
	}
});
