<script lang="ts">
	import { onMount, onDestroy, type Component } from 'svelte';
	import Hammer from '@lucide/svelte/icons/hammer';
	import LogIn from '@lucide/svelte/icons/log-in';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Flame from '@lucide/svelte/icons/flame';
	import Tent from '@lucide/svelte/icons/tent';
	import Music from '@lucide/svelte/icons/music';
	import Utensils from '@lucide/svelte/icons/utensils';
	import Beer from '@lucide/svelte/icons/beer';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Sunrise from '@lucide/svelte/icons/sunrise';
	import Sun from '@lucide/svelte/icons/sun';
	import Sunset from '@lucide/svelte/icons/sunset';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import Zap from '@lucide/svelte/icons/zap';
	import CookingPot from '@lucide/svelte/icons/cooking-pot';
	import Beef from '@lucide/svelte/icons/beef';
	import Apple from '@lucide/svelte/icons/apple';
	import Carrot from '@lucide/svelte/icons/carrot';
	import Soup from '@lucide/svelte/icons/soup';
	import Wine from '@lucide/svelte/icons/wine';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { data } = $props();

	const TARGET = new Date('2026-06-12T12:00:00+02:00').getTime();

	let now = $state(Date.now());
	let mounted = $state(false);
	let menuOpen = $state(false);
	let activeSection = $state('willkommen');
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		mounted = true;
		now = Date.now();
		interval = setInterval(() => (now = Date.now()), 60_000);

		const ids = ['willkommen', 'information', 'ablauf', 'planung'];
		const sections = ids
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeSection = entry.target.id;
				}
			},
			{ rootMargin: '-40% 0px -55% 0px', threshold: 0 }
		);
		sections.forEach((s) => observer.observe(s));

		return () => observer.disconnect();
	});

	onDestroy(() => clearInterval(interval));

	const remaining = $derived(Math.max(0, TARGET - now));
	const days = $derived(Math.floor(remaining / 86_400_000));

	let embers = $state<
		Array<{ left: number; size: number; delay: number; dur: number; drift: number; hue: number }>
	>([]);
	$effect(() => {
		if (!mounted) return;
		embers = Array.from({ length: 26 }, () => ({
			left: Math.random() * 100,
			size: 2 + Math.random() * 4,
			delay: Math.random() * 10,
			dur: 10 + Math.random() * 10,
			drift: -80 + Math.random() * 160,
			hue: -10 + Math.random() * 20
		}));
	});

	const firstName = $derived(data.name?.split(' ')[0] ?? null);

	const nav = [
		{ id: 'information', label: 'Information' },
		{ id: 'ablauf', label: 'Ablauf' },
		{ id: 'planung', label: 'Planung' }
	];

	type AblaufStep = {
		day: string;
		date: string;
		title: string;
		icon: Component<{ class?: string }>;
		body: string;
	};

	const ablauf: AblaufStep[] = [
		{
			day: 'Freitag',
			date: '12. Juni',
			title: 'Ankunft & Lagerbau',
			icon: Sunrise,
			body: 'Ab dem Mittag treffen wir am Ort des Geschehens ein. Gemeinsam stellen wir Pavillon und Lager auf, sammeln Holz und bereiten alles für das Wochenende vor. Der Abend gehört dem ersten Feuer, ruhigen Getränken und dem Wiedersehen.'
		},
		{
			day: 'Samstag',
			date: '13. Juni',
			title: 'Das große Fest',
			icon: Sun,
			body: 'Der Tag der Tage. Kessel über dem Feuer, Schwenker am Glühen, Musik aus der Anlage und tanzende Beine. Nach Einbruch der Dunkelheit erwachen die heidnischen Bräuche — ein Opfer für die Flammen, ein Lied an die Nacht.'
		},
		{
			day: 'Sonntag',
			date: '14. Juni',
			title: 'Abreise & Aufbruch',
			icon: Sunset,
			body: 'Wir lassen das Lager so zurück, wie wir es gefunden haben. Wer noch Kraft in den Knochen hat, hilft beim Abbau — viele Hände machen leichtes Werk. Mit klarem Kopf und vollem Herzen geht es zurück in die Welt.'
		}
	];

	type Info = {
		icon: Component<{ class?: string }>;
		title: string;
		body: string;
	};

	const infos: Info[] = [
		{
			icon: Flame,
			title: 'Feuer & Kessel',
			body: 'Ein Feuer brennt durch alle drei Tage. Im Kessel köchelt, was wir hineingeben — am Schwenker brutzelt, was wir mitbringen. Wer kocht, bestimmt das Mahl.'
		},
		{
			icon: Music,
			title: 'Musik & Tanz',
			body: 'Die Anlage spielt, was die Nacht verlangt. Solange jemand tanzt, ist die Nacht noch jung.'
		},
		{
			icon: Beer,
			title: 'Speis & Trank',
			body: 'Bier, Getränke, Grillfleisch, Gemüse. Geteilt wird alles, gehortet nichts. Wer leer ist, fragt — wer voll ist, gibt.'
		},
		{
			icon: Sparkles,
			title: 'Heidnische Bräuche',
			body: 'Wir lassen die alten Götter ein wenig mitfeiern. Es wird gebrannt, beschworen, gerufen und gelacht. Nichts ganz Ernst, nichts ganz Scherz.'
		}
	];

	type PlanItem = {
		name: string;
		category: string;
		icon: Component<{ class?: string }>;
	};

	const planung: PlanItem[] = [
		{ name: 'Pavillon', category: 'Lager', icon: Tent },
		{ name: 'Anlage', category: 'Klang', icon: Music },
		{ name: 'Strom', category: 'Lager', icon: Zap },
		{ name: 'Feuerholz', category: 'Feuer', icon: TreePine },
		{ name: 'Kochkessel', category: 'Küche', icon: CookingPot },
		{ name: 'Schwenkgrill', category: 'Küche', icon: Flame },
		{ name: 'Bier', category: 'Getränke', icon: Beer },
		{ name: 'Getränke', category: 'Getränke', icon: Wine },
		{ name: 'Obst', category: 'Speise', icon: Apple },
		{ name: 'Gemüse', category: 'Speise', icon: Carrot },
		{ name: 'Grillfleisch', category: 'Speise', icon: Beef },
		{ name: 'Sauce', category: 'Speise', icon: Soup }
	];

	function scrollTo(id: string) {
		menuOpen = false;
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

{#snippet sectionHeading(kicker: string, label: string, title: string)}
	<div class="flex flex-col items-start">
		<div
			class="text-ember/80 flex items-center gap-3 text-[10px] tracking-[0.36em] uppercase sm:text-[11px]"
			style="font-family: var(--font-display);"
		>
			<span class="bg-ember/40 inline-block h-px w-6"></span>
			<span>{kicker}</span>
			<span>·</span>
			<span>{label}</span>
		</div>
		<h2
			class="text-foreground mt-4 leading-[1.05] font-medium tracking-[-0.02em]"
			style="font-family: var(--font-display); font-size: clamp(2rem, 5.5vw, 3.5rem);"
		>
			{title}
		</h2>
	</div>
{/snippet}

{#snippet sectionDivider()}
	<div class="relative flex items-center justify-center py-2" aria-hidden="true">
		<div class="flex items-center gap-4">
			<span
				class="h-px w-16 sm:w-24"
				style="background: linear-gradient(to right, transparent, var(--ember));"
			></span>
			<span class="bg-ember size-1.5 rounded-full opacity-70"></span>
			<span
				class="h-px w-16 sm:w-24"
				style="background: linear-gradient(to left, transparent, var(--ember));"
			></span>
		</div>
	</div>
{/snippet}

<svelte:head>
	<title>Heidenfest — 12.–14. Juni 2026</title>
</svelte:head>

<div class="grain bg-background relative min-h-screen">
	<!-- Persistent atmosphere -->
	<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		<div
			class="animate-fire-pulse absolute top-1/2 left-1/2 size-[min(120vw,1100px)] rounded-full opacity-40 blur-[120px]"
			style="background: radial-gradient(circle, var(--ember) 0%, transparent 60%);"
		></div>
		<div
			class="absolute -top-40 -left-40 size-105 rounded-full opacity-20 blur-[110px]"
			style="background: radial-gradient(circle, var(--forest), transparent 70%);"
		></div>
		<div
			class="absolute -right-32 bottom-1/4 size-96 rounded-full opacity-15 blur-[100px]"
			style="background: radial-gradient(circle, var(--wood), transparent 70%);"
		></div>
		<div
			class="absolute inset-0"
			style="background: radial-gradient(ellipse at center, transparent 40%, color-mix(in oklch, var(--background) 75%, transparent) 100%);"
		></div>

		<div class="ember-stage absolute inset-0">
			{#each embers as e}
				<span
					class="ember"
					style="left: {e.left}%; width: {e.size}px; height: {e.size}px; --delay: {e.delay}s; --dur: {e.dur}s; --drift: {e.drift}px; filter: hue-rotate({e.hue}deg);"
				></span>
			{/each}
		</div>
	</div>

	<!-- Sticky navigation -->
	<header class="bg-background/60 sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4">
			<button
				onclick={() => scrollTo('willkommen')}
				class="flex items-center gap-2.5 text-left"
				style="font-family: var(--font-display);"
				aria-label="Zum Anfang"
			>
				<span class="bg-ember relative inline-block size-2 rounded-full">
					<span class="bg-ember absolute inset-0 animate-ping rounded-full opacity-60"></span>
				</span>
				<span class="text-foreground/90 text-sm tracking-[0.32em] uppercase sm:text-base">
					Heidenfest
				</span>
			</button>

			<nav class="hidden items-center gap-1 sm:flex" style="font-family: var(--font-display);">
				{#each nav as item}
					<button
						onclick={() => scrollTo(item.id)}
						class="relative rounded-full px-4 py-2 text-[11px] tracking-[0.24em] uppercase transition-colors {activeSection ===
						item.id
							? 'text-ember'
							: 'text-foreground/70 hover:text-foreground'}"
					>
						{item.label}
						{#if activeSection === item.id}
							<span class="bg-ember absolute right-4 bottom-1 left-4 h-px"></span>
						{/if}
					</button>
				{/each}
			</nav>

			<div class="flex items-center gap-2">
				{#if data.isAuthed}
					<a
						href="/members"
						class="group from-ember to-ember-bright text-background hidden items-center gap-2 rounded-full bg-linear-to-br px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02] sm:inline-flex sm:px-4 sm:py-2 sm:text-[11px]"
						style="font-family: var(--font-display); box-shadow: 0 6px 24px -6px color-mix(in oklch, var(--ember) 50%, transparent);"
					>
						<span>Zum Planungsbereich</span>
						<ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
					</a>
				{:else}
					<a
						href="/login"
						class="group bg-card/40 hover:border-ember/40 hover:bg-card/70 hidden items-center gap-2 rounded-full border border-white/8 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase backdrop-blur-md transition-all sm:inline-flex sm:px-4 sm:py-2 sm:text-[11px]"
						style="font-family: var(--font-display);"
					>
						<LogIn class="text-ember size-3.5 transition-transform group-hover:translate-x-0.5" />
						<span>Zum Planen anmelden</span>
					</a>
				{/if}

				<button
					onclick={() => (menuOpen = !menuOpen)}
					class="bg-card/40 hover:bg-card/70 inline-flex size-9 items-center justify-center rounded-full border border-white/8 backdrop-blur-md transition-colors sm:hidden"
					aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
				>
					{#if menuOpen}
						<X class="text-foreground size-4" />
					{:else}
						<Menu class="text-foreground size-4" />
					{/if}
				</button>
			</div>
		</div>

		{#if menuOpen}
			<nav
				class="bg-background/80 border-t border-white/5 px-4 py-4 backdrop-blur-xl sm:hidden"
				style="font-family: var(--font-display);"
			>
				<div class="flex flex-col">
					{#each nav as item}
						<button
							onclick={() => scrollTo(item.id)}
							class="flex items-center justify-between py-3 text-left text-sm tracking-[0.24em] uppercase {activeSection ===
							item.id
								? 'text-ember'
								: 'text-foreground/80'}"
						>
							<span>{item.label}</span>
							<span class="text-ember/60">›</span>
						</button>
					{/each}

					{#if data.isAuthed}
						<a
							href="/members"
							class="from-ember to-ember-bright text-background mt-3 flex items-center justify-between gap-2 rounded-full bg-linear-to-br px-4 py-3 text-[11px] font-semibold tracking-[0.24em] uppercase"
						>
							<span>Zum Planungsbereich</span>
							<ArrowRight class="size-4" />
						</a>
					{:else}
						<a
							href="/login"
							class="border-ember/30 bg-ember/5 text-ember mt-3 flex items-center justify-between gap-2 rounded-full border px-4 py-3 text-[11px] tracking-[0.24em] uppercase"
						>
							<span>Zum Planen anmelden</span>
							<LogIn class="size-4" />
						</a>
					{/if}
				</div>
			</nav>
		{/if}
	</header>

	<main class="relative z-10">
		<!-- Hero -->
		<section
			id="willkommen"
			class="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center sm:px-10"
		>
			<div
				class="animate-fade-up border-ember/20 bg-ember/5 text-ember inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-[0.32em] uppercase backdrop-blur-sm sm:text-[11px]"
				style="font-family: var(--font-display); animation-delay: 0.1s;"
			>
				<Hammer class="size-3.5 animate-pulse" />
				12.–14. Juni 2026
			</div>

			<h1
				class="animate-fade-up mt-6 leading-[0.95] font-black tracking-[-0.03em] sm:mt-8"
				style="font-family: var(--font-display); font-size: clamp(2.4rem, 9vw, 6rem); animation-delay: 0.25s;"
			>
				{#if firstName}
					<span class="block">Sei gegrüßt,</span>
					<span
						class="from-ember-bright via-ember to-ember bg-linear-to-br bg-clip-text text-transparent"
					>
						{firstName}.
					</span>
				{:else}
					<span class="block">Heidenfest</span>
					<span
						class="from-ember-bright via-ember to-ember bg-linear-to-br bg-clip-text text-transparent"
					>
						MMXXVI.
					</span>
				{/if}
			</h1>

			<div
				class="runic-divider animate-underline-grow mt-6 w-32 max-w-full sm:mt-8 sm:w-48"
				style="animation-delay: 0.85s;"
			></div>

			<p
				class="animate-fade-up text-foreground/80 mt-6 max-w-md text-base leading-relaxed text-balance sm:mt-8 sm:max-w-xl sm:text-lg"
				style="font-family: var(--font-body); font-style: italic; animation-delay: 0.95s;"
			>
				Ein Wochenende im tiefen Wald. Feuer, Kessel, Tanz und alte Bräuche — von Freunden für
				Freunde.
			</p>

			{#if mounted}
				<div
					class="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 sm:mt-14"
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
							class="text-ember mt-1 text-3xl font-light sm:text-4xl"
							style="font-family: var(--font-body); font-feature-settings: 'tnum';"
						>
							{days}
							<span class="text-muted-foreground/70 ml-1 text-sm tracking-widest">Tage</span>
						</span>
					</div>

					<div class="bg-border/60 hidden h-12 w-px sm:block"></div>

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
							Fr. 12. Juni · 12:00
						</span>
					</div>

					<div class="bg-border/60 hidden h-12 w-px sm:block"></div>

					<div class="flex flex-col items-center">
						<span
							class="text-muted-foreground text-[9px] tracking-[0.32em] uppercase sm:text-[10px]"
							style="font-family: var(--font-display);"
						>
							Im
						</span>
						<span
							class="text-foreground mt-1 text-base sm:text-lg"
							style="font-family: var(--font-body);"
						>
							tiefen Wald
						</span>
					</div>
				</div>

				<div
					class="animate-fade-up mt-12 flex flex-col items-center gap-5 sm:mt-16"
					style="animation-delay: 1.25s;"
				>
					{#if data.isAuthed}
						<a
							href="/members"
							class="group from-ember to-ember-bright text-background relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-linear-to-br px-7 text-xs font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02] sm:h-13 sm:gap-3 sm:px-8 sm:text-sm"
							style="font-family: var(--font-display); box-shadow: 0 12px 36px -8px color-mix(in oklch, var(--ember) 60%, transparent);"
						>
							<span
								class="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
								style="background: linear-gradient(90deg, transparent, color-mix(in oklch, white 30%, transparent), transparent);"
							></span>
							<span>Zum Planungsbereich</span>
							<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					{:else}
						<a
							href="/login"
							class="group from-ember to-ember-bright text-background relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-linear-to-br px-7 text-xs font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02] sm:h-13 sm:gap-3 sm:px-8 sm:text-sm"
							style="font-family: var(--font-display); box-shadow: 0 12px 36px -8px color-mix(in oklch, var(--ember) 60%, transparent);"
						>
							<span
								class="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
								style="background: linear-gradient(90deg, transparent, color-mix(in oklch, white 30%, transparent), transparent);"
							></span>
							<LogIn class="size-4 transition-transform group-hover:rotate-6" />
							<span>Zum Planen anmelden</span>
						</a>
					{/if}

					<button
						onclick={() => scrollTo('information')}
						class="text-muted-foreground hover:text-ember group inline-flex flex-col items-center gap-2 transition-colors"
						style="font-family: var(--font-display);"
						aria-label="Weiter zum Inhalt"
					>
						<span class="text-[10px] tracking-[0.32em] uppercase">Mehr erfahren</span>
						<span
							class="border-foreground/30 group-hover:border-ember flex size-8 items-center justify-center rounded-full border transition-colors"
						>
							<ChevronDown class="animate-bounce-slow size-4" />
						</span>
					</button>
				</div>
			{/if}
		</section>

		<!-- Information -->
		<section id="information" class="relative scroll-mt-20 px-4 py-20 sm:px-10 sm:py-32">
			<div class="mx-auto max-w-4xl">
				{@render sectionHeading('I', 'Information', 'Was uns erwartet')}

				<div class="mt-12 grid gap-8 sm:mt-16 sm:gap-10">
					<p
						class="text-foreground/85 text-lg leading-[1.75] sm:text-xl"
						style="font-family: var(--font-body);"
					>
						Das <em class="text-ember font-medium not-italic">Heidenfest</em> ist kein Konzert, kein
						Festival, kein Programm mit Bühne und Bändchen. Es ist ein Wochenende unter Freunden —
						geplant von Freunden, für Freunde. Drei Tage, eine Lichtung, ein Feuer.
					</p>

					<div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
						{#each infos as info}
							{@const Icon = info.icon}
							<div
								class="group border-ember/10 bg-card/30 hover:border-ember/30 hover:bg-card/50 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all sm:p-7"
							>
								<div
									class="border-ember/20 bg-ember/5 text-ember flex size-11 items-center justify-center rounded-xl border transition-transform group-hover:scale-105"
								>
									<Icon class="size-5" />
								</div>
								<h3
									class="text-foreground mt-4 text-xl font-medium sm:text-2xl"
									style="font-family: var(--font-display);"
								>
									{info.title}
								</h3>
								<p
									class="text-foreground/75 mt-3 text-[15px] leading-relaxed sm:text-base"
									style="font-family: var(--font-body);"
								>
									{info.body}
								</p>
							</div>
						{/each}
					</div>

					<div
						class="border-ember/15 bg-card/30 mt-4 rounded-2xl border p-6 backdrop-blur-sm sm:p-8"
					>
						<div
							class="text-ember/80 text-[10px] tracking-[0.32em] uppercase"
							style="font-family: var(--font-display);"
						>
							Eine Bitte
						</div>
						<p
							class="text-foreground/85 mt-3 text-base leading-relaxed sm:text-lg"
							style="font-family: var(--font-body); font-style: italic;"
						>
							Bring dein bestes Lachen, deinen größten Durst und alles, was unter
							<span class="text-ember not-italic">Planung</span> noch offen ist. Den Rest erledigt
							das Feuer.
						</p>
					</div>
				</div>
			</div>
		</section>

		{@render sectionDivider()}

		<!-- Ablauf -->
		<section id="ablauf" class="relative scroll-mt-20 px-4 py-20 sm:px-10 sm:py-32">
			<div class="mx-auto max-w-4xl">
				{@render sectionHeading('II', 'Ablauf', 'Drei Tage, ein Feuer')}

				<div class="mt-12 sm:mt-16">
					<ol class="relative space-y-10 sm:space-y-14">
						<div
							class="absolute top-2 bottom-2 left-[15px] w-px sm:left-[19px]"
							style="background: linear-gradient(to bottom, transparent, var(--ember) 10%, var(--ember) 90%, transparent);"
							aria-hidden="true"
						></div>

						{#each ablauf as step}
							{@const StepIcon = step.icon}
							<li class="relative pl-12 sm:pl-16">
								<div
									class="bg-background border-ember/60 absolute top-1 left-0 flex size-[31px] items-center justify-center rounded-full border-2 sm:size-[39px]"
								>
									<span
										class="from-ember to-ember-bright text-background flex size-full items-center justify-center rounded-full bg-linear-to-br"
									>
										<StepIcon class="size-3.5 sm:size-4" />
									</span>
								</div>

								<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<span
										class="text-ember text-[10px] tracking-[0.32em] uppercase sm:text-[11px]"
										style="font-family: var(--font-display);"
									>
										{step.day}
									</span>
									<span
										class="text-muted-foreground text-[10px] tracking-[0.24em] uppercase sm:text-[11px]"
										style="font-family: var(--font-display);"
									>
										· {step.date}
									</span>
								</div>

								<h3
									class="text-foreground mt-2 text-2xl leading-tight font-medium sm:text-3xl"
									style="font-family: var(--font-display);"
								>
									{step.title}
								</h3>

								<p
									class="text-foreground/75 mt-3 max-w-2xl text-base leading-relaxed sm:text-lg"
									style="font-family: var(--font-body);"
								>
									{step.body}
								</p>
							</li>
						{/each}
					</ol>
				</div>
			</div>
		</section>

		{@render sectionDivider()}

		<!-- Planung -->
		<section id="planung" class="relative scroll-mt-20 px-4 py-20 sm:px-10 sm:py-32">
			<div class="mx-auto max-w-4xl">
				{@render sectionHeading('III', 'Planung', 'Wer bringt was')}

				<p
					class="text-foreground/70 mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
					style="font-family: var(--font-body); font-style: italic;"
				>
					Damit das Feuer nicht hungrig bleibt. Trag dich ein, wo du kannst — was hier nicht steht,
					darf gern dazukommen.
				</p>

				<div
					class="border-ember/15 bg-card/30 mt-10 overflow-hidden rounded-2xl border backdrop-blur-sm sm:mt-14"
				>
					<div
						class="text-muted-foreground bg-card/40 hidden grid-cols-[1fr_1fr_1fr] border-b border-white/5 px-6 py-3 text-[10px] tracking-[0.28em] uppercase sm:grid"
						style="font-family: var(--font-display);"
					>
						<span>Sache</span>
						<span>Art</span>
						<span class="text-right">Wer bringt's?</span>
					</div>

					<ul>
						{#each planung as item, i}
							{@const ItemIcon = item.icon}
							<li
								class="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-white/5 sm:grid-cols-[1fr_1fr_1fr] sm:gap-6 sm:px-6 sm:py-5 {i !==
								planung.length - 1
									? 'border-b border-white/5'
									: ''}"
							>
								<div class="flex items-center gap-3 sm:gap-4">
									<span
										class="border-ember/20 bg-ember/5 text-ember flex size-9 shrink-0 items-center justify-center rounded-lg border sm:size-10"
									>
										<ItemIcon class="size-4 sm:size-[18px]" />
									</span>
									<span
										class="text-foreground text-base font-medium sm:text-lg"
										style="font-family: var(--font-body);"
									>
										{item.name}
									</span>
								</div>

								<span
									class="text-muted-foreground hidden text-[10px] tracking-[0.28em] uppercase sm:inline-block"
									style="font-family: var(--font-display);"
								>
									{item.category}
								</span>

								<span
									class="text-muted-foreground/70 text-right text-sm italic sm:text-base"
									style="font-family: var(--font-body);"
								>
									— noch offen —
								</span>
							</li>
						{/each}
					</ul>
				</div>

				<div
					class="mt-8 flex flex-col items-center gap-3 sm:mt-10"
					style="font-family: var(--font-display);"
				>
					{#if data.isAuthed}
						<a
							href="/members"
							class="group from-ember to-ember-bright text-background inline-flex items-center gap-2 rounded-full bg-linear-to-br px-5 py-2.5 text-[11px] font-semibold tracking-[0.2em] uppercase shadow-lg transition-all hover:scale-[1.02]"
							style="box-shadow: 0 10px 30px -8px color-mix(in oklch, var(--ember) 55%, transparent);"
						>
							<span>Im Planungsbereich eintragen</span>
							<ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
						</a>
					{:else}
						<a
							href="/login"
							class="group border-ember/30 bg-ember/5 text-ember hover:bg-ember/10 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-colors"
						>
							<LogIn class="size-3.5" />
							<span>Anmelden, um etwas zu übernehmen</span>
						</a>
					{/if}
					<p
						class="text-muted-foreground/70 text-center text-[10px] tracking-[0.18em] uppercase sm:text-[11px]"
					>
						Was hier fehlt, darf gern dazukommen
					</p>
				</div>
			</div>
		</section>

		<footer
			class="relative z-10 border-t border-white/5 px-4 py-6 sm:px-10 sm:py-8"
			style="font-family: var(--font-display);"
		>
			<div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
				<span
					class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
				>
					Heidenfest · MMXXVI
				</span>
				<span
					class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
				>
					Im tiefen Wald
				</span>
			</div>
		</footer>
	</main>
</div>

<style>
	@keyframes bounce-slow {
		0%, 100% {
			transform: translateY(0);
			opacity: 0.6;
		}
		50% {
			transform: translateY(4px);
			opacity: 1;
		}
	}
	:global(.animate-bounce-slow) {
		animation: bounce-slow 2.4s ease-in-out infinite;
	}
</style>
