// Remove leftovers from automated test runs: MCP-Test events and API tokens.
const BASE = 'http://localhost:5173';

const signin = await fetch(`${BASE}/api/auth/sign-in/email`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', origin: BASE },
	body: JSON.stringify({ email: 'smoke-test@example.com', password: 'test-password-1234' })
});
const cookie = signin.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

async function call(method, path, body) {
	const res = await fetch(`${BASE}/api/v1/${path}`, {
		method,
		headers: { 'content-type': 'application/json', cookie, origin: BASE },
		body: body ? JSON.stringify(body) : undefined
	});
	return (await res.json()).data;
}

const events = await call('GET', 'events');
for (const event of events.filter((e) => e.name.startsWith('MCP-Test'))) {
	await call('DELETE', `events/${event._id}`);
	console.log('deleted event:', event.name, event._id);
}

const tokens = await call('GET', 'tokens');
for (const token of tokens) {
	await call('DELETE', `tokens/${token._id}`);
	console.log('revoked token:', token.name);
}
console.log('done');
