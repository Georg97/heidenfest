// Mobile screenshots of the main screens (iPhone 14-ish viewport).
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'scripts/shots';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const signin = await fetch(`${BASE}/api/auth/sign-in/email`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', origin: BASE },
	body: JSON.stringify({ email: 'smoke-test@example.com', password: 'test-password-1234' })
});
const cookies = signin.headers.getSetCookie().map((c) => {
	const [pair] = c.split(';');
	const [name, ...rest] = pair.split('=');
	return {
		name,
		value: rest.join('='),
		domain: 'localhost',
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'Lax'
	};
});

const browser = await chromium.launch();
const ctx = await browser.newContext({
	viewport: { width: 390, height: 844 },
	deviceScaleFactor: 2
});
await ctx.addCookies(cookies);

const eventsRes = await fetch(`${BASE}/api/v1/events`, {
	headers: { cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; ') }
});
const events = (await eventsRes.json()).data;
const heidenfest = events.find((e) => e.name === 'Heidenfest');

const shots = [
	['landing', `${BASE}/`],
	['login', `${BASE}/login`],
	['events', `${BASE}/events`],
	['event-lists', `${BASE}/events/${heidenfest._id}`],
	['event-info', `${BASE}/events/${heidenfest._id}?tab=info`],
	['event-members', `${BASE}/events/${heidenfest._id}?tab=people`],
	['notifications', `${BASE}/notifications`],
	['profile', `${BASE}/profile`]
];

for (const [name, url] of shots) {
	const page = await ctx.newPage();
	await page.goto(url, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1800); // let queries resolve + entry animations settle
	await page.screenshot({ path: `${OUT}/${name}.png` });
	console.log(`shot: ${name}`);
	await page.close();
}

await browser.close();
