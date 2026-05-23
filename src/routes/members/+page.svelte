<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Hammer from '@lucide/svelte/icons/hammer';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Users from '@lucide/svelte/icons/users';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	let { data } = $props();

	let mounted = $state(false);
	let signingOut = $state(false);

	let embers = $state<
		Array<{ left: number; size: number; delay: number; dur: number; drift: number; hue: number }>
	>([]);

	onMount(() => {
		mounted = true;
		embers = Array.from({ length: 20 }, () => ({
			left: Math.random() * 100,
			size: 2 + Math.random() * 4,
			delay: Math.random() * 10,
			dur: 10 + Math.random() * 10,
			drift: -80 + Math.random() * 160,
			hue: -10 + Math.random() * 20
		}));
	});

	onDestroy(() => {});

	async function handleSignOut() {
		signingOut = true;
		await authClient.signOut();
		goto('/');
	}

	const firstName = $derived(data.name?.split(' ')[0] ?? 'Freund');

	const plannedFeatures = [
		{
			icon: ClipboardList,
			title: 'Was bringt wer mit',
			body:
				'Aus der öffentlichen Liste wird hier ein echtes Eintragen — pro Sache ein Name, ein Kommentar, ein Status.'
		},
		{
			icon: ListChecks,
			title: 'Aufgaben & Checklisten',
			body:
				'Holz holen, Anlage testen, Auto packen. Kleine Listen, die wir gemeinsam abhaken.'
		},
		{
			icon: Users,
			title: 'Wer kommt wann',
			body:
				'Anreise- und Abreisezeiten, Mitfahrgelegenheiten, Schlafplätze. Damit am Freitag niemand allein im Wald steht.'
		},
		{
			icon: MessageCircle,
			title: 'Absprachen',
			body:
				'Ein ruhiger Ort für alles, was kein WhatsApp-Chaos werden soll. Pinned, ordentlich, auffindbar.'
		}
	];
</script>

<svelte:head>
	<title>Planungsbereich — Heidenfest</title>
</svelte:head>

<div class="grain bg-background relative min-h-screen">
	<!-- Atmosphere -->
	<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		<div
			class="animate-fire-pulse absolute top-1/2 left-1/2 size-[min(120vw,1100px)] rounded-full opacity-35 blur-[120px]"
			style="background: radial-gradient(circle, var(--ember) 0%, transparent 60%);"
		></div>
		<div
			class="absolute -top-40 -left-40 size-105 rounded-full opacity-20 blur-[110px]"
			style="background: radial-gradient(circle, var(--forest), transparent 70%);"
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

	<!-- Header -->
	<header class="bg-background/60 sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
		<div
			class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4"
		>
			<a
				href="/"
				class="group text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
				style="font-family: var(--font-display);"
			>
				<ArrowLeft class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
				<span class="text-[10px] tracking-[0.28em] uppercase sm:text-[11px]">Zur Festseite</span>
			</a>

			<div
				class="flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase sm:text-[11px]"
				style="font-family: var(--font-display);"
			>
				<span class="bg-ember relative inline-block size-2 rounded-full">
					<span class="bg-ember absolute inset-0 animate-ping rounded-full opacity-60"></span>
				</span>
				<span class="text-foreground/90 hidden sm:inline">Planungsbereich</span>
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
		</div>
	</header>

	<main class="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-10 sm:py-24">
		<!-- Greeting -->
		<div class="text-center">
			<div
				class="animate-fade-up border-ember/20 bg-ember/5 text-ember inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-[0.32em] uppercase backdrop-blur-sm sm:text-[11px]"
				style="font-family: var(--font-display); animation-delay: 0.1s;"
			>
				<Hammer class="size-3.5 animate-pulse" />
				In Arbeit
			</div>

			<h1
				class="animate-fade-up mt-6 leading-[1.05] font-medium tracking-[-0.02em] sm:mt-8"
				style="font-family: var(--font-display); font-size: clamp(2rem, 7vw, 4rem); animation-delay: 0.25s;"
			>
				<span class="block">Willkommen, {firstName}.</span>
				<span
					class="from-ember-bright via-ember to-ember bg-linear-to-br bg-clip-text text-transparent"
				>
					Planungsbereich
				</span>
			</h1>

			<div
				class="runic-divider animate-underline-grow mx-auto mt-6 w-32 max-w-full sm:mt-8 sm:w-48"
				style="animation-delay: 0.85s;"
			></div>

			<p
				class="animate-fade-up text-foreground/80 mx-auto mt-6 max-w-xl text-base leading-relaxed text-balance sm:mt-8 sm:text-lg"
				style="font-family: var(--font-body); font-style: italic; animation-delay: 0.95s;"
			>
				Hier entsteht der Bereich, in dem wir das Fest gemeinsam organisieren. Noch ist es leer am
				Lagerfeuer — bald wird hier eingetragen, abgehakt und abgesprochen.
			</p>
		</div>

		<!-- Empty state card -->
		<div
			class="border-ember/15 bg-card/30 animate-fade-up mt-12 rounded-2xl border p-6 backdrop-blur-sm sm:mt-16 sm:p-10"
			style="animation-delay: 1.1s;"
		>
			<div
				class="text-ember/80 flex items-center gap-3 text-[10px] tracking-[0.32em] uppercase sm:text-[11px]"
				style="font-family: var(--font-display);"
			>
				<span class="bg-ember/40 inline-block h-px w-6"></span>
				<span>Bald hier zu finden</span>
			</div>

			<h2
				class="text-foreground mt-4 text-2xl leading-tight font-medium sm:text-3xl"
				style="font-family: var(--font-display);"
			>
				Was als nächstes ans Feuer kommt
			</h2>

			<div class="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
				{#each plannedFeatures as f}
					{@const Icon = f.icon}
					<div
						class="border-ember/10 bg-card/40 hover:border-ember/25 group rounded-xl border p-5 transition-colors sm:p-6"
					>
						<div
							class="border-ember/20 bg-ember/5 text-ember flex size-10 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 sm:size-11"
						>
							<Icon class="size-5" />
						</div>
						<h3
							class="text-foreground mt-4 text-lg font-medium sm:text-xl"
							style="font-family: var(--font-display);"
						>
							{f.title}
						</h3>
						<p
							class="text-foreground/70 mt-2 text-sm leading-relaxed sm:text-[15px]"
							style="font-family: var(--font-body);"
						>
							{f.body}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Helper line -->
		<p
			class="text-muted-foreground/70 animate-fade-up mt-10 text-center text-[11px] tracking-[0.18em] uppercase sm:mt-14"
			style="font-family: var(--font-display); animation-delay: 1.3s;"
		>
			Solange noch nichts steht · sag im Chat Bescheid, was du übernimmst
		</p>
	</main>

	<footer
		class="relative z-10 border-t border-white/5 px-4 py-6 sm:px-10 sm:py-8"
		style="font-family: var(--font-display);"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<a
				href="/"
				class="text-muted-foreground/60 hover:text-foreground/80 text-[9px] tracking-[0.26em] uppercase transition-colors sm:text-[10px] sm:tracking-[0.3em]"
			>
				← Festseite
			</a>
			<span
				class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>
				Heidenfest · MMXXVI
			</span>
		</div>
	</footer>
</div>
