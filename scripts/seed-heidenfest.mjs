// Seed the real Heidenfest 2026 event from the original landing page content.
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
	const json = await res.json();
	if (!res.ok) throw new Error(`${method} ${path}: ${json.message}`);
	return json.data;
}

const existing = await call('GET', 'events');
if (existing.some((e) => e.name === 'Heidenfest')) {
	console.log('Heidenfest already seeded, skipping.');
	process.exit(0);
}

const eventId = await call('POST', 'events', {
	name: 'Heidenfest',
	brief:
		'Ein Wochenende im tiefen Wald. Feuer, Kessel, Tanz und alte Bräuche — von Freunden für Freunde. Drei Tage, eine Lichtung, ein Feuer.',
	startDate: '2026-06-12',
	endDate: '2026-06-14'
});
console.log('event:', eventId);

const listId = await call('POST', `events/${eventId}/lists`, {
	title: 'Wer bringt was?',
	description: 'Damit das Feuer nicht hungrig bleibt — was hier nicht steht, darf gern dazukommen.'
});
const items = [
	'Pavillon',
	'Anlage',
	'Strom',
	'Feuerholz',
	'Kochkessel',
	'Schwenkgrill',
	'Bier',
	'Getränke',
	'Obst',
	'Gemüse',
	'Grillfleisch',
	'Sauce'
];
for (const title of items) {
	await call('POST', `lists/${listId}/entries`, { title });
}
console.log(`list with ${items.length} entries`);

await call('POST', `events/${eventId}/pages`, {
	title: 'Ablauf',
	content: [
		'## Freitag, 12. Juni — Ankunft & Lagerbau',
		'Ab dem Mittag treffen wir am Ort des Geschehens ein. Gemeinsam stellen wir Pavillon und Lager auf, sammeln Holz und bereiten alles für das Wochenende vor. Der Abend gehört dem ersten Feuer, ruhigen Getränken und dem Wiedersehen.',
		'',
		'## Samstag, 13. Juni — Das große Fest',
		'Der Tag der Tage. Kessel über dem Feuer, Schwenker am Glühen, Musik aus der Anlage und tanzende Beine. Nach Einbruch der Dunkelheit erwachen die heidnischen Bräuche — ein Opfer für die Flammen, ein Lied an die Nacht.',
		'',
		'## Sonntag, 14. Juni — Abreise & Aufbruch',
		'Wir lassen das Lager so zurück, wie wir es gefunden haben. Wer noch Kraft in den Knochen hat, hilft beim Abbau — viele Hände machen leichtes Werk. Mit klarem Kopf und vollem Herzen geht es zurück in die Welt.'
	].join('\n')
});

await call('POST', `events/${eventId}/pages`, {
	title: 'Was uns erwartet',
	content: [
		'Das **Heidenfest** ist kein Konzert, kein Festival, kein Programm mit Bühne und Bändchen. Es ist ein Wochenende unter Freunden — geplant von Freunden, für Freunde.',
		'',
		'- **Feuer & Kessel** — Ein Feuer brennt durch alle drei Tage. Im Kessel köchelt, was wir hineingeben. Wer kocht, bestimmt das Mahl.',
		'- **Musik & Tanz** — Die Anlage spielt, was die Nacht verlangt. Solange jemand tanzt, ist die Nacht noch jung.',
		'- **Speis & Trank** — Geteilt wird alles, gehortet nichts. Wer leer ist, fragt — wer voll ist, gibt.',
		'- **Heidnische Bräuche** — Es wird gebrannt, beschworen, gerufen und gelacht. Nichts ganz Ernst, nichts ganz Scherz.',
		'',
		'> Bring dein bestes Lachen, deinen größten Durst und alles, was in der Liste noch offen ist. Den Rest erledigt das Feuer.'
	].join('\n')
});
console.log('2 pages');
console.log('Seeded Heidenfest:', eventId);
