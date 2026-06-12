'use node';

import nodemailer from 'nodemailer';
import { v } from 'convex/values';
import { internalAction } from './_generated/server';

/**
 * Email delivery via plain SMTP (nodemailer), called through the Convex
 * scheduler so mutations never block on sending. Relays through any mailbox
 * you already own (own mail server, Gmail app password, …) — no mail API
 * service involved.
 *
 * Deployment env vars:
 * - SMTP_HOST, SMTP_USER, SMTP_PASS — without them, sends are logged and
 *   skipped (dev-friendly).
 * - SMTP_PORT — optional, default 587 (STARTTLS); 465 uses implicit TLS.
 * - EMAIL_FROM — optional sender, e.g. 'skol <fest@example.com>'.
 *   Defaults to SMTP_USER. Must be an address the SMTP account may send as.
 */
export const send = internalAction({
	args: { to: v.string(), subject: v.string(), html: v.string() },
	handler: async (_ctx, args) => {
		const host = process.env.SMTP_HOST;
		const user = process.env.SMTP_USER;
		const pass = process.env.SMTP_PASS;
		if (!host || !user || !pass) {
			console.log(
				`Email skipped (SMTP_HOST/SMTP_USER/SMTP_PASS not set): to=${args.to} subject="${args.subject}"`
			);
			return;
		}
		const port = Number(process.env.SMTP_PORT ?? 587);
		const transport = nodemailer.createTransport({
			host,
			port,
			secure: port === 465,
			auth: { user, pass }
		});
		await transport.sendMail({
			from: process.env.EMAIL_FROM ?? user,
			to: args.to,
			subject: args.subject,
			html: args.html
		});
	}
});
