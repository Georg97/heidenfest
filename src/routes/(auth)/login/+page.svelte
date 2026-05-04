<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import Loader from '@lucide/svelte/icons/loader';
	import Flame from '@lucide/svelte/icons/flame';

	// 12 June 2026, 12:00 CEST (UTC+2) — fixed instant in time
	const TARGET = new Date('2026-06-12T12:00:00+02:00').getTime();

	let now = $state(Date.now());
	let mounted = $state(false);
	let googleLoading = $state(false);

	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		mounted = true;
		now = Date.now();
		interval = setInterval(() => (now = Date.now()), 1000);
	});

	onDestroy(() => clearInterval(interval));

	const remaining = $derived(Math.max(0, TARGET - now));
	const days = $derived(Math.floor(remaining / 86_400_000));
	const hours = $derived(Math.floor((remaining % 86_400_000) / 3_600_000));
	const mins = $derived(Math.floor((remaining % 3_600_000) / 60_000));
	const secs = $derived(Math.floor((remaining % 60_000) / 1000));

	const pad = (n: number, w = 2) => String(n).padStart(w, '0');

	// Localized opening time for the user (German locale, user's local timezone)
	const localOpening = $derived.by(() => {
		if (!mounted) return '';
		try {
			return new Intl.DateTimeFormat('de-DE', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				timeZoneName: 'short'
			}).format(new Date(TARGET));
		} catch {
			return new Date(TARGET).toLocaleString('de-DE');
		}
	});

	const HEIDENFEST = 'HEIDENFEST'.split('');

	// Deterministic-ish ember particles (computed client-side after mount to avoid SSR mismatch)
	let embers = $state<Array<{ left: number; size: number; delay: number; dur: number; drift: number; hue: number }>>([]);
	$effect(() => {
		if (!mounted) return;
		embers = Array.from({ length: 28 }, () => ({
			left: Math.random() * 100,
			size: 2 + Math.random() * 5,
			delay: Math.random() * 8,
			dur: 7 + Math.random() * 9,
			drift: -60 + Math.random() * 120,
			hue: -10 + Math.random() * 20
		}));
	});

	async function handleGoogle() {
		googleLoading = true;
		try {
			await authClient.signIn.social({ provider: 'google' });
		} catch {
			toast.error('Sign in failed. Try again.');
			googleLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Heidenfest — 12. Juni 2026</title>
	<meta name="description" content="Heidenfest — eine Nacht im Wald. Met, Feuer, Freunde. 12. Juni 2026." />
</svelte:head>

<div class="grain bg-background relative flex min-h-screen flex-col overflow-hidden">
	<!-- ===== Atmosphere: glow pools ===== -->
	<div
		class="animate-fire-pulse pointer-events-none absolute top-1/2 left-1/2 size-[min(120vw,1100px)] rounded-full opacity-60 blur-[120px]"
		style="background: radial-gradient(circle, var(--ember) 0%, transparent 60%);"
	></div>
	<div
		class="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full opacity-30 blur-[110px]"
		style="background: radial-gradient(circle, var(--forest), transparent 70%);"
	></div>
	<div
		class="pointer-events-none absolute -right-40 -bottom-40 size-[520px] rounded-full opacity-30 blur-[110px]"
		style="background: radial-gradient(circle, var(--wood), transparent 70%);"
	></div>

	<!-- ===== Vignette ===== -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse at center, transparent 40%, color-mix(in oklch, var(--background) 75%, transparent) 100%);"
	></div>

	<!-- ===== Embers ===== -->
	<div class="ember-stage" aria-hidden="true">
		{#each embers as e}
			<span
				class="ember"
				style="left: {e.left}%; width: {e.size}px; height: {e.size}px; --delay: {e.delay}s; --dur: {e.dur}s; --drift: {e.drift}px; filter: hue-rotate({e.hue}deg);"
			></span>
		{/each}
	</div>

	<!-- ===== Top bar ===== -->
	<header class="relative z-20 flex items-center justify-center px-4 py-4 sm:px-10 sm:py-6">
		<div
			class="animate-fade-in text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase sm:text-[11px] sm:tracking-[0.32em]"
			style="font-family: var(--font-display); animation-delay: 0.6s;"
		>
			<span class="bg-ember inline-block size-1.5 rounded-full"></span>
			Anno · MMXXVI
			<span class="bg-ember inline-block size-1.5 rounded-full"></span>
		</div>
	</header>

	<!-- ===== Main ===== -->
	<main class="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 text-center sm:px-10 sm:pb-16">
		<!-- Logo -->
		<div class="animate-logo-reveal relative" style="animation-delay: 0.05s;">
			<!-- Soft glow under the logo -->
			<div
				class="animate-fire-flicker pointer-events-none absolute top-1/2 left-1/2 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[60px]"
				style="background: radial-gradient(circle, var(--ember) 0%, transparent 65%);"
			></div>

			<!-- Slow orbiting ring of runes -->
			<div
				class="animate-orbit-slow pointer-events-none absolute top-1/2 left-1/2 size-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
				style="border: 1px dashed var(--ember);"
			></div>

			<div
				class="bg-card/30 ring-ember/15 relative size-37.5 overflow-hidden rounded-full p-2 ring-1 backdrop-blur-sm sm:size-60"
				style="box-shadow: inset 0 0 60px color-mix(in oklch, var(--ember) 25%, transparent), 0 12px 60px -12px color-mix(in oklch, var(--ember) 40%, transparent);"
			>
				<img
					src="/festival-art-dark.webp"
					alt="Heidenfest"
					class="size-full rounded-full object-cover"
				/>
			</div>
		</div>

		<!-- Tiny eyebrow -->
		<p
			class="animate-fade-up text-ember mt-6 text-[9px] tracking-[0.4em] uppercase sm:mt-10 sm:text-[10px] sm:tracking-[0.5em]"
			style="font-family: var(--font-display); animation-delay: 0.7s;"
		>
			· Met · Feuer · Freunde ·
		</p>

		<!-- Title — letter by letter -->
		<h1
			class="mt-2 leading-[0.9] font-black whitespace-nowrap sm:mt-3"
			style="font-family: var(--font-display); font-size: clamp(2.2rem, 11vw, 7rem); letter-spacing: -0.045em;"
			aria-label="Heidenfest"
		>
			{#each HEIDENFEST as letter, i}
				<span
					class="title-letter animate-title-letter"
					style="animation-delay: {0.85 + i * 0.06}s;"
				>{letter}</span>
			{/each}
		</h1>

		<!-- Underline -->
		<div
			class="runic-divider animate-underline-grow mt-4 w-32 max-w-full sm:mt-5 sm:w-48"
			style="animation-delay: 1.7s;"
		></div>

		<!-- Primer -->
		<p
			class="animate-fade-up text-foreground/85 mt-4 max-w-[20rem] text-balance text-sm leading-relaxed sm:mt-6 sm:max-w-md sm:text-lg"
			style="font-family: var(--font-body); font-style: italic; animation-delay: 1.85s;"
		>
			Eine Nacht im Wald. Trinkhörner gehoben, das Feuer hoch, die Geschichten lauter.
			Versammelt euch — die Götter rufen. Sie verlangen Opfer!
		</p>

		<!-- Countdown -->
		<div class="animate-fade-up mt-6 w-full max-w-md sm:mt-12" style="animation-delay: 2s;">
			<p
				class="text-muted-foreground mb-3 text-[9px] tracking-[0.32em] uppercase sm:mb-4 sm:text-[10px] sm:tracking-[0.4em]"
				style="font-family: var(--font-display);"
			>
				Möge das Feuer ewig brennen
			</p>

			<div class="flex items-end justify-center gap-2 sm:gap-5">
				{#each [{ v: pad(days, 2), l: 'Tage' }, { v: pad(hours), l: 'Std' }, { v: pad(mins), l: 'Min' }, { v: pad(secs), l: 'Sek' }] as block, i (block.l)}
					<div class="flex flex-1 flex-col items-center sm:flex-initial">
						<div
							class="bg-card/40 ring-ember/10 hover:ring-ember/40 relative flex h-16 w-full min-w-0 items-center justify-center rounded-xl px-1 ring-1 backdrop-blur-md transition-all sm:h-28 sm:w-auto sm:min-w-24 sm:rounded-2xl sm:px-5"
							style="box-shadow: inset 0 1px 0 color-mix(in oklch, var(--foreground) 6%, transparent), 0 8px 30px -10px color-mix(in oklch, var(--ember) 30%, transparent);"
						>
							<!-- inner ember glow -->
							<div
								class="pointer-events-none absolute inset-x-2 bottom-1 h-3 rounded-full opacity-50 blur-md"
								style="background: var(--ember);"
							></div>
							<span
								class="countdown-num text-foreground text-3xl font-light sm:text-6xl"
								style="font-family: var(--font-body); font-feature-settings: 'tnum';"
							>
								{block.v}
							</span>
						</div>
						<span
							class="text-muted-foreground mt-1.5 text-[9px] tracking-[0.22em] uppercase sm:mt-2 sm:text-[10px] sm:tracking-[0.3em]"
							style="font-family: var(--font-display);"
						>
							{block.l}
						</span>
					</div>
					{#if i < 3}
						<div
							class="text-ember/60 -mt-6 hidden text-3xl font-light sm:block sm:text-5xl"
							style="font-family: var(--font-body);"
							aria-hidden="true"
						>
							:
						</div>
					{/if}
				{/each}
			</div>

			<!-- Localized opening time -->
			{#if mounted}
				<p
					class="text-muted-foreground/80 mt-4 text-[11px] sm:mt-5 sm:text-xs"
					style="font-family: var(--font-body);"
				>
					{localOpening}
				</p>
			{/if}
		</div>

		<!-- Login button -->
		<button
			onclick={handleGoogle}
			disabled={googleLoading}
			class="group bg-ember text-primary-foreground hover:bg-ember/90 relative mt-7 inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full px-7 text-xs font-medium tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 sm:mt-12 sm:h-13 sm:gap-3 sm:px-8 sm:text-sm"
			style="font-family: var(--font-display); animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) 2.2s both, button-glow 3s ease-in-out 3s infinite;"
		>
			<!-- shimmer sweep -->
			<span
				class="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
				style="background: linear-gradient(90deg, transparent, color-mix(in oklch, white 30%, transparent), transparent);"
			></span>
			{#if googleLoading}
				<Loader class="size-4 animate-spin" />
			{:else}
				<Flame class="size-4 transition-transform group-hover:rotate-12" />
			{/if}
			<span>Tritt ein</span>
			<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M5 12h14M13 5l7 7-7 7"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		<p
			class="animate-fade-up text-muted-foreground/60 mt-4 text-[11px] sm:mt-5 sm:text-xs"
			style="animation-delay: 2.4s;"
		>
			Mit Google fortfahren
		</p>
	</main>

	<!-- ===== Footer ===== -->
	<footer
		class="relative z-10 flex items-center justify-between px-4 py-4 sm:px-10 sm:py-5"
		style="font-family: var(--font-display);"
	>
		<span class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>Heidenfest · MMXXVI</span
		>
		<span class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>Im tiefen Wald</span
		>
	</footer>
</div>
