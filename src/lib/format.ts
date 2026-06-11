const DAY_MS = 86_400_000;

const day = new Intl.DateTimeFormat('de-DE', { day: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' });
const full = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

/** "12.–14. Juni 2026" / "30. Mai – 2. Juni 2026" / "30. Dezember 2026 – 2. Januar 2027" */
export function formatRange(startMs: number, endMs: number): string {
	const start = new Date(startMs);
	const end = new Date(endMs);
	if (start.toDateString() === end.toDateString()) return full.format(start);
	if (start.getFullYear() !== end.getFullYear()) {
		return `${full.format(start)} – ${full.format(end)}`;
	}
	if (start.getMonth() !== end.getMonth()) {
		return `${dayMonth.format(start)} – ${full.format(end)}`;
	}
	return `${day.format(start)}.–${full.format(end)}`;
}

export type EventPhase = 'upcoming' | 'running' | 'past';

export function eventPhase(startMs: number, endMs: number, now = Date.now()): EventPhase {
	// The event runs through the whole end day.
	if (now > endMs + DAY_MS) return 'past';
	if (now >= startMs) return 'running';
	return 'upcoming';
}

/** "in 23 Tagen" / "morgen" / "heute geht's los" / "brennt gerade" / "verglüht" */
export function phaseLabel(startMs: number, endMs: number, now = Date.now()): string {
	const phase = eventPhase(startMs, endMs, now);
	if (phase === 'past') return 'verglüht';
	if (phase === 'running') return 'brennt gerade';
	const days = Math.ceil((startMs - now) / DAY_MS);
	if (days <= 0) return "heute geht's los";
	if (days === 1) return 'morgen';
	return `in ${days} Tagen`;
}

/** ms timestamp → "yyyy-MM-dd" for <input type="date"> (local time). */
export function toDateInput(ms: number): string {
	const d = new Date(ms);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "yyyy-MM-dd" → ms timestamp at local noon (DST-safe day anchor). */
export function fromDateInput(value: string): number {
	const [y, m, d] = value.split('-').map(Number);
	return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

/** R2 keys are served via /api/images/; external URLs (e.g. Google avatars) pass through. */
export function imageUrl(image: string | null | undefined): string | null {
	if (!image) return null;
	return image.startsWith('http') ? image : `/api/images/${image}`;
}

export function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]!.toUpperCase())
		.join('');
}
