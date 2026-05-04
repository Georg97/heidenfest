<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Hammer from '@lucide/svelte/icons/hammer';

	let { data } = $props();

	// Same target the auth page uses — keep them in sync
	const TARGET = new Date('2026-06-12T12:00:00+02:00').getTime();

	let now = $state(Date.now());
	let mounted = $state(false);
	let signingOut = $state(false);
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		mounted = true;
		now = Date.now();
		interval = setInterval(() => (now = Date.now()), 60_000);
	});

	onDestroy(() => clearInterval(interval));

	const remaining = $derived(Math.max(0, TARGET - now));
	const days = $derived(Math.floor(remaining / 86_400_000));

	let embers = $state<Array<{ left: number; size: number; delay: number; dur: number; drift: number; hue: number }>>([]);
	$effect(() => {
		if (!mounted) return;
		embers = Array.from({ length: 18 }, () => ({
			left: Math.random() * 100,
			size: 2 + Math.random() * 4,
			delay: Math.random() * 8,
			dur: 8 + Math.random() * 9,
			drift: -60 + Math.random() * 120,
			hue: -10 + Math.random() * 20
		}));
	});

	async function handleSignOut() {
		signingOut = true;
		await authClient.signOut();
		goto('/login');
	}

	const firstName = $derived(data.user?.name?.split(' ')[0] ?? 'Freund');
</script>

<svelte:head>
	<title>Heidenfest — In Vorbereitung</title>
</svelte:head>

<div class="grain bg-background relative flex min-h-screen flex-col overflow-hidden">
	<!-- Atmosphere -->
	<div
		class="animate-fire-pulse pointer-events-none absolute top-1/2 left-1/2 size-[min(120vw,1100px)] rounded-full opacity-50 blur-[120px]"
		style="background: radial-gradient(circle, var(--ember) 0%, transparent 60%);"
	></div>
	<div
		class="pointer-events-none absolute -top-40 -left-40 size-105 rounded-full opacity-20 blur-[110px]"
		style="background: radial-gradient(circle, var(--forest), transparent 70%);"
	></div>
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse at center, transparent 40%, color-mix(in oklch, var(--background) 75%, transparent) 100%);"
	></div>

	<!-- Embers -->
	<div class="ember-stage" aria-hidden="true">
		{#each embers as e}
			<span
				class="ember"
				style="left: {e.left}%; width: {e.size}px; height: {e.size}px; --delay: {e.delay}s; --dur: {e.dur}s; --drift: {e.drift}px; filter: hue-rotate({e.hue}deg);"
			></span>
		{/each}
	</div>

	<!-- Top bar -->
	<header class="relative z-20 flex items-center justify-between gap-4 px-4 py-4 sm:px-10 sm:py-6">
		<div
			class="text-muted-foreground animate-fade-in flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase sm:text-[11px] sm:tracking-[0.32em]"
			style="font-family: var(--font-display); animation-delay: 0.4s;"
		>
			<span class="bg-ember inline-block size-1.5 rounded-full"></span>
			<span class="hidden sm:inline">Heidenfest ·</span>
			<span class="text-foreground/80">Sei gegrüßt, {firstName}</span>
		</div>

		<button
			onclick={handleSignOut}
			disabled={signingOut}
			class="group bg-card/40 hover:border-ember/40 hover:bg-card/70 inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase backdrop-blur-md transition-all disabled:opacity-50 sm:px-4 sm:py-2 sm:text-[11px]"
			style="font-family: var(--font-display);"
			aria-label="Abmelden"
		>
			<LogOut class="text-ember size-3.5 transition-transform group-hover:translate-x-0.5" />
			<span class="hidden sm:inline">Abmelden</span>
		</button>
	</header>

	<!-- Main -->
	<main class="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 text-center sm:px-10 sm:pb-16">
		<!-- Status badge -->
		<div
			class="animate-fade-up border-ember/20 bg-ember/5 text-ember inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-[0.32em] uppercase backdrop-blur-sm sm:text-[11px]"
			style="font-family: var(--font-display); animation-delay: 0.1s;"
		>
			<Hammer class="size-3.5 animate-pulse" />
			In Vorbereitung
		</div>

		<!-- Headline -->
		<h1
			class="animate-fade-up mt-6 leading-[0.95] font-black tracking-[-0.03em] sm:mt-8"
			style="font-family: var(--font-display); font-size: clamp(2.4rem, 9vw, 6rem); animation-delay: 0.25s;"
		>
			<span class="block">An dieser</span>
			<span class="block">
				<span class="italic font-light text-muted-foreground">Stelle</span>
				entsteht
			</span>
			<span class="from-ember-bright via-ember to-ember bg-linear-to-br bg-clip-text text-transparent">
				das Fest.
			</span>
		</h1>

		<!-- Underline -->
		<div
			class="runic-divider animate-underline-grow mt-6 w-32 max-w-full sm:mt-8 sm:w-48"
			style="animation-delay: 0.85s;"
		></div>

		<!-- Body -->
		<p
			class="animate-fade-up text-foreground/80 mt-6 max-w-md text-balance text-base leading-relaxed sm:mt-8 sm:max-w-xl sm:text-lg"
			style="font-family: var(--font-body); font-style: italic; animation-delay: 0.95s;"
		>
			Hier wird in den nächsten Wochen das Heidenfest geplant — Programm, Lager, Speis und Trank.
			Schau bald wieder vorbei.
		</p>

		<!-- Mini info row -->
		{#if mounted}
			<div
				class="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:mt-14"
				style="animation-delay: 1.1s;"
			>
				<div class="flex flex-col items-center">
					<span
						class="text-muted-foreground text-[9px] tracking-[0.32em] uppercase sm:text-[10px]"
						style="font-family: var(--font-display);"
					>
						Noch
					</span>
					<span
						class="text-ember mt-1 text-2xl font-light sm:text-3xl"
						style="font-family: var(--font-body); font-feature-settings: 'tnum';"
					>
						{days}
						<span class="text-muted-foreground/70 ml-1 text-sm tracking-widest">Tage</span>
					</span>
				</div>

				<div class="bg-border/60 hidden h-10 w-px sm:block"></div>

				<div class="flex flex-col items-center">
					<span
						class="text-muted-foreground text-[9px] tracking-[0.32em] uppercase sm:text-[10px]"
						style="font-family: var(--font-display);"
					>
						Beginn
					</span>
					<span
						class="text-foreground mt-1 text-base sm:text-lg"
						style="font-family: var(--font-body);"
					>
						12. Juni 2026 · 12:00
					</span>
				</div>
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer
		class="relative z-10 flex items-center justify-between px-4 py-4 sm:px-10 sm:py-5"
		style="font-family: var(--font-display);"
	>
		<span
			class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>Heidenfest · MMXXVI</span
		>
		<span
			class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>Im tiefen Wald</span
		>
	</footer>
</div>
