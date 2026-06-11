// End-to-end smoke test of the skol REST API (and thereby all Convex functions).
// Requires the dev server running and the smoke-test user to exist.
const BASE = 'http://localhost:5173';
let failures = 0;

function check(label, cond, extra = '') {
	console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
	if (!cond) failures++;
}

// --- session sign-in (cookie) ---
const signin = await fetch(`${BASE}/api/auth/sign-in/email`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', origin: BASE },
	body: JSON.stringify({ email: 'smoke-test@example.com', password: 'test-password-1234' })
});
const cookie = signin.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
check('session sign-in', signin.ok);

async function sessionCall(method, path, body) {
	const res = await fetch(`${BASE}/api/v1/${path}`, {
		method,
		headers: { 'content-type': 'application/json', cookie, origin: BASE },
		body: body ? JSON.stringify(body) : undefined
	});
	return { status: res.status, ...(await res.json().catch(() => ({}))) };
}

// --- mint API token via session ---
const mint = await sessionCall('POST', 'tokens', { name: 'smoke-mcp' });
check('mint token', mint.ok === true && mint.data.token.startsWith('skol_'));
const TOKEN = mint.data.token;
const TOKEN_ID = mint.data.tokenId;

async function call(method, path, body, token = TOKEN) {
	const res = await fetch(`${BASE}/api/v1/${path}`, {
		method,
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {})
		},
		body: body ? JSON.stringify(body) : undefined
	});
	return { status: res.status, ...(await res.json().catch(() => ({}))) };
}

// --- me ---
const me = await call('GET', 'me');
check('GET me', me.data?.email === 'smoke-test@example.com');
const badMe = await call('GET', 'me', undefined, 'skol_invalid-token');
check('GET me with bad token → 401', badMe.status === 401);
const noAuth = await fetch(`${BASE}/api/v1/me`);
check('GET me without auth → 401', noAuth.status === 401);

// --- events CRUD ---
const created = await call('POST', 'events', {
	name: 'Heidenfest API-Test',
	brief: 'Wir treffen uns und feiern zusammen in der Natur.',
	startDate: '2026-08-07',
	endDate: '2026-08-09'
});
check('POST events', created.ok === true, JSON.stringify(created).slice(0, 120));
const eventId = created.data;

const events = await call('GET', 'events');
check('GET events contains created', events.data?.some((e) => e._id === eventId));

const one = await call('GET', `events/${eventId}`);
check('GET event, creator is admin', one.data?.role === 'admin');

const patched = await call('PATCH', `events/${eventId}`, { brief: 'Aktualisierter Brief.' });
check('PATCH event', patched.ok === true);

// --- lists, entries, marks ---
const list = await call('POST', `events/${eventId}/lists`, { title: 'Wer bringt was zum Grillen?' });
check('POST list', list.ok === true);
const listId = list.data;

const entryNames = ['Brot', 'Steak', 'Gemüse', 'Sauce'];
const entryIds = [];
for (const title of entryNames) {
	const entry = await call('POST', `lists/${listId}/entries`, { title });
	entryIds.push(entry.data);
}
check('POST entries ×4', entryIds.every(Boolean));

const marked = await call('POST', `entries/${entryIds[0]}/mark`, { comment: 'bringe 3 Stück' });
check('POST mark with comment', marked.ok === true);

let listsData = await call('GET', `events/${eventId}/lists`);
let breadEntry = listsData.data?.[0]?.entries.find((e) => e.title === 'Brot');
check(
	'GET lists shows mark + comment',
	breadEntry?.marks?.[0]?.comment === 'bringe 3 Stück' &&
		breadEntry?.marks?.[0]?.userName === 'Convex Smoke Test'
);

const unmarked = await call('DELETE', `marks/${breadEntry.marks[0]._id}`);
check('DELETE mark', unmarked.ok === true);

await call('POST', `entries/${entryIds[1]}/mark`, {});
const entryPatch = await call('PATCH', `entries/${entryIds[3]}`, { title: 'Kräutersauce' });
check('PATCH entry', entryPatch.ok === true);
const entryDel = await call('DELETE', `entries/${entryIds[2]}`);
check('DELETE entry', entryDel.ok === true);

// --- pages ---
const pageCreated = await call('POST', `events/${eventId}/pages`, {
	title: 'Treffpunkt',
	content: '# Ablauf\n\nWir treffen uns **12 Uhr** am Fluss.\n\n- Zelt mitbringen\n- Gute Laune'
});
check('POST page', pageCreated.ok === true);
const pages = await call('GET', `events/${eventId}/pages`);
check('GET pages', pages.data?.length === 1 && pages.data[0].title === 'Treffpunkt');
const pagePatch = await call('PATCH', `pages/${pages.data[0]._id}`, { title: 'Treffpunkt & Ablauf' });
check('PATCH page', pagePatch.ok === true);

// --- members ---
const members = await call('GET', `events/${eventId}/members`);
check('GET members, creator is admin', members.data?.[0]?.role === 'admin');
const badAdd = await call('POST', `events/${eventId}/members`, { email: 'gibtsnicht@example.com' });
check('POST member unknown email → 400', badAdd.status === 400);

// --- duplicate event ---
const dup = await call('POST', `events/${eventId}/duplicate`, {
	name: 'Heidenfest API-Test II',
	startDate: '2027-08-06',
	endDate: '2027-08-08'
});
check('POST duplicate', dup.ok === true);
const dupId = dup.data;
const dupLists = await call('GET', `events/${dupId}/lists`);
const dupEntries = dupLists.data?.[0]?.entries ?? [];
check(
	'duplicate copied lists+entries without marks',
	dupLists.data?.length === 1 &&
		dupEntries.length === 3 &&
		dupEntries.every((e) => e.marks.length === 0)
);
const dupPages = await call('GET', `events/${dupId}/pages`);
check('duplicate copied pages', dupPages.data?.length === 1);

// --- copy list between events ---
const copyRes = await call('POST', `lists/${listId}/copy`, { targetEventId: dupId });
check('POST list copy', copyRes.ok === true);
const dupLists2 = await call('GET', `events/${dupId}/lists`);
check('copied list arrived', dupLists2.data?.length === 2);

// --- app admin ---
const users = await call('GET', 'users');
check('GET users (app admin)', Array.isArray(users.data) && users.data.length >= 1);

// --- token revocation ---
const revoked = await sessionCall('DELETE', `tokens/${TOKEN_ID}`);
check('DELETE token (session)', revoked.ok === true);
const afterRevoke = await call('GET', 'me');
check('revoked token → 401', afterRevoke.status === 401);

// --- cleanup (session auth still works) ---
const del1 = await sessionCall('DELETE', `events/${eventId}`);
const del2 = await sessionCall('DELETE', `events/${dupId}`);
check('cleanup events', del1.ok === true && del2.ok === true);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
