// Dev smoke test: sign in, upload a 1x1 PNG to R2 through the app, fetch it back.
const BASE = 'http://localhost:5173';

const signin = await fetch(`${BASE}/api/auth/sign-in/email`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', origin: BASE },
	body: JSON.stringify({ email: 'smoke-test@example.com', password: 'test-password-1234' })
});
console.log('signin:', signin.status);
const cookie = signin.headers
	.getSetCookie()
	.map((c) => c.split(';')[0])
	.join('; ');

const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
);
const form = new FormData();
form.append('file', new Blob([png], { type: 'image/png' }), 'test.png');
const upload = await fetch(`${BASE}/api/images`, {
	method: 'POST',
	headers: { cookie, origin: BASE },
	body: form
});
console.log('upload:', upload.status, await upload.text().then((t) => t.slice(0, 200)));
if (!upload.ok) process.exit(1);
