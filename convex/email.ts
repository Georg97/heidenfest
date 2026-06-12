import { v } from 'convex/values';
import { internalAction } from './_generated/server';

/**
 * Email delivery via Resend (https://resend.com), called through the Convex
 * scheduler so mutations never block on (or leak) email sending.
 *
 * Deployment env vars:
 * - RESEND_API_KEY — without it, sends are logged and skipped (dev-friendly).
 * - EMAIL_FROM     — sender, e.g. 'skol <fest@example.com>'. Defaults to
 *                    Resend's onboarding sender (only delivers to the
 *                    account owner — fine for testing).
 * - SITE_URL       — used for links in the emails (already set for auth).
 */

const FALLBACK_FROM = 'skol <onboarding@resend.dev>';

function shell(content: string): string {
	return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:24px;background:#0f0c09;">
	<div style="max-width:520px;margin:0 auto;background:#1a1410;border:1px solid #3a2c1e;border-radius:14px;padding:32px 28px;font-family:Georgia,'Times New Roman',serif;color:#f0e6d8;">
		<p style="margin:0 0 24px;font-size:13px;letter-spacing:0.32em;color:#e8853b;">skol</p>
		${content}
		<p style="margin:32px 0 0;font-size:11px;letter-spacing:0.2em;color:#8a7b69;">skol &middot; sk&aring;l &mdash; auf gute Feste</p>
	</div>
</body>
</html>`;
}

function button(href: string, label: string): string {
	return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#e8853b;color:#1a1410;padding:11px 24px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:14px;">${label}</a>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Invitation for someone who has no skol account yet. */
export function inviteEmail(args: { inviterName: string; eventName: string }): {
	subject: string;
	html: string;
} {
	const siteUrl = process.env.SITE_URL ?? '';
	const inviter = escapeHtml(args.inviterName);
	const event = escapeHtml(args.eventName);
	return {
		subject: `${args.inviterName} lädt dich zu „${args.eventName}“ ein`,
		html: shell(
			`<h1 style="margin:0 0 12px;font-size:20px;color:#f5ede0;">Du bist eingeladen!</h1>
			<p style="margin:0;font-size:15px;line-height:1.6;color:#cdbfa9;">
				${inviter} lädt dich zu <strong style="color:#f0e6d8;">„${event}“</strong> auf skol ein —
				dort werden Listen, Infos und alles rund ums Fest geplant.
			</p>
			<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#cdbfa9;">
				Registriere dich mit dieser E-Mail-Adresse, dann bist du automatisch dabei.
			</p>
			${button(`${siteUrl}/login`, 'Jetzt mitplanen')}`
		)
	};
}

/** Generic notification email mirroring an in-app notification. */
export function notificationEmail(args: {
	title: string;
	body?: string;
	eventId?: string;
}): { subject: string; html: string } {
	const siteUrl = process.env.SITE_URL ?? '';
	const link = args.eventId ? `${siteUrl}/events/${args.eventId}` : `${siteUrl}/events`;
	return {
		subject: args.title,
		html: shell(
			`<h1 style="margin:0 0 12px;font-size:18px;color:#f5ede0;">${escapeHtml(args.title)}</h1>
			${args.body ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#cdbfa9;">${escapeHtml(args.body)}</p>` : ''}
			${button(link, 'Zum Fest')}`
		)
	};
}

export const send = internalAction({
	args: { to: v.string(), subject: v.string(), html: v.string() },
	handler: async (_ctx, args) => {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			console.log(`Email skipped (RESEND_API_KEY not set): to=${args.to} subject="${args.subject}"`);
			return;
		}
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: process.env.EMAIL_FROM ?? FALLBACK_FROM,
				to: [args.to],
				subject: args.subject,
				html: args.html
			})
		});
		if (!response.ok) {
			throw new Error(`Resend ${response.status}: ${await response.text()}`);
		}
	}
});
