<script lang="ts">
	import Atmosphere from '$lib/components/app/Atmosphere.svelte';
	import LogIn from '@lucide/svelte/icons/log-in';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Flame from '@lucide/svelte/icons/flame';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Users from '@lucide/svelte/icons/users';
	import CopyPlus from '@lucide/svelte/icons/copy-plus';

	let { data } = $props();

	const firstName = $derived(data.name?.split(' ')[0] ?? null);

	const features = [
		{
			icon: ClipboardList,
			title: 'Wer bringt was',
			body: 'Listen für alles, was ans Feuer muss: Grillgut, Getränke, Feuerholz. Trag dich ein, schreib einen Kommentar — alle sehen sofort, was noch fehlt.'
		},
		{
			icon: ScrollText,
			title: 'Alles Wichtige',
			body: 'Treffpunkt, Ablauf, Packliste: Die Gastgeber schreiben es auf Seiten, die jeder Gast unterwegs auf dem Handy lesen kann.'
		},
		{
			icon: Users,
			title: 'Gemeinsam planen',
			body: 'Gäste einladen, Mitstreiter zu Gastgebern machen. Jede Änderung erscheint live bei allen — ohne Aktualisieren, ohne Chaos.'
		},
		{
			icon: CopyPlus,
			title: 'Die Saga geht weiter',
			body: 'Das nächste Fest? Einmal duplizieren, neues Datum wählen — Listen und Infos ziehen mit. Bewährtes bleibt, nur das Feuer ist neu.'
		}
	];
</script>

<svelte:head>
	<title>skol — Feste planen wie am Lagerfeuer</title>
	<meta
		name="description"
		content="skol ist die Planungs-App für Feste unter Freunden: Wer bringt was, alle Infos an einem Ort, live für alle. Skål!"
	/>
</svelte:head>

<div class="grain bg-background relative min-h-screen overflow-hidden">
	<Atmosphere embers={26} />

	<header class="bg-background/60 sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
			<span class="flex items-center gap-2.5" style="font-family: var(--font-display);">
				<span class="bg-ember relative inline-block size-2 rounded-full">
					<span class="bg-ember absolute inset-0 animate-ping rounded-full opacity-60"></span>
				</span>
				<span class="text-foreground/90 text-base tracking-[0.32em] lowercase">skol</span>
			</span>

			{#if data.isAuthed}
				<a
					href="/events"
					class="group from-ember to-ember-bright text-background inline-flex items-center gap-2 rounded-full bg-linear-to-br px-4 py-2 text-[10px] font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02] sm:text-[11px]"
					style="font-family: var(--font-display); box-shadow: 0 6px 24px -6px color-mix(in oklch, var(--ember) 50%, transparent);"
				>
					<span>Zu deinen Festen</span>
					<ArrowRight class="size-3.5 transition-transform group-hover:translate-x-0.5" />
				</a>
			{:else}
				<a
					href="/login"
					class="group bg-card/40 hover:border-ember/40 hover:bg-card/70 inline-flex items-center gap-2 rounded-full border border-white/8 px-4 py-2 text-[10px] tracking-[0.18em] uppercase backdrop-blur-md transition-all sm:text-[11px]"
					style="font-family: var(--font-display);"
				>
					<LogIn class="text-ember size-3.5 transition-transform group-hover:translate-x-0.5" />
					<span>Anmelden</span>
				</a>
			{/if}
		</div>
	</header>

	<main class="relative z-10">
		<!-- Hero -->
		<section
			class="relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-4 py-16 text-center sm:px-10"
		>
			<div
				class="animate-fade-up border-ember/20 bg-ember/5 text-ember inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-[0.32em] uppercase backdrop-blur-sm sm:text-[11px]"
				style="font-family: var(--font-display); animation-delay: 0.1s;"
			>
				<Flame class="size-3.5 animate-pulse" />
				skål — auf gute Feste
			</div>

			<h1
				class="animate-fade-up mt-6 leading-[0.95] font-black tracking-[-0.03em] sm:mt-8"
				style="font-family: var(--font-display); font-size: clamp(3.2rem, 14vw, 7rem); animation-delay: 0.25s;"
			>
				{#if firstName}
					<span class="block text-[0.45em] font-medium">Sei gegrüßt, {firstName}.</span>
				{/if}
				<span
					class="from-ember-bright via-ember to-ember block bg-linear-to-br bg-clip-text lowercase text-transparent"
				>
					skol
				</span>
			</h1>

			<div
				class="runic-divider animate-underline-grow mt-6 w-32 max-w-full sm:mt-8 sm:w-48"
				style="animation-delay: 0.85s;"
			></div>

			<p
				class="animate-fade-up text-foreground/80 mt-6 max-w-md text-base leading-relaxed text-balance sm:mt-8 sm:max-w-xl sm:text-lg"
				style="font-family: var(--font-body); font-style: italic; animation-delay: 0.95s;"
			>
				Feste planen wie am Lagerfeuer: Wer bringt was, wo treffen wir uns, was steht an — alles
				an einem Ort, live für alle. Von Freunden, für Freunde.
			</p>

			<div
				class="animate-fade-up mt-12 flex flex-col items-center gap-5"
				style="animation-delay: 1.15s;"
			>
				<a
					href={data.isAuthed ? '/events' : '/login'}
					class="group from-ember to-ember-bright text-background relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-linear-to-br px-7 text-xs font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02] sm:h-13 sm:gap-3 sm:px-8 sm:text-sm"
					style="font-family: var(--font-display); box-shadow: 0 12px 36px -8px color-mix(in oklch, var(--ember) 60%, transparent);"
				>
					<span
						class="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
						style="background: linear-gradient(90deg, transparent, color-mix(in oklch, white 30%, transparent), transparent);"
					></span>
					{#if data.isAuthed}
						<span>Zu deinen Festen</span>
						<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
					{:else}
						<LogIn class="size-4 transition-transform group-hover:rotate-6" />
						<span>Anmelden & losplanen</span>
					{/if}
				</a>
			</div>
		</section>

		<!-- Features -->
		<section class="relative px-4 pb-24 sm:px-10 sm:pb-32">
			<div class="mx-auto max-w-4xl">
				<div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
					{#each features as feature}
						{@const Icon = feature.icon}
						<div
							class="group border-ember/10 bg-card/30 hover:border-ember/30 hover:bg-card/50 relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all sm:p-7"
						>
							<div
								class="border-ember/20 bg-ember/5 text-ember flex size-11 items-center justify-center rounded-xl border transition-transform group-hover:scale-105"
							>
								<Icon class="size-5" />
							</div>
							<h2
								class="text-foreground mt-4 text-xl font-medium sm:text-2xl"
								style="font-family: var(--font-display);"
							>
								{feature.title}
							</h2>
							<p
								class="text-foreground/75 mt-3 text-[15px] leading-relaxed sm:text-base"
								style="font-family: var(--font-body);"
							>
								{feature.body}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</section>
	</main>

	<footer
		class="relative z-10 border-t border-white/5 px-4 py-6 sm:px-10 sm:py-8"
		style="font-family: var(--font-display);"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<span
				class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>
				skol
			</span>
			<span
				class="text-muted-foreground/60 text-[9px] tracking-[0.26em] uppercase sm:text-[10px] sm:tracking-[0.3em]"
			>
				skål — auf gute Feste
			</span>
		</div>
	</footer>
</div>
