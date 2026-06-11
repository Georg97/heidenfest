<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { formatRange, phaseLabel, eventPhase, imageUrl } from '$lib/format';
	import Plus from '@lucide/svelte/icons/plus';
	import Flame from '@lucide/svelte/icons/flame';
	import Crown from '@lucide/svelte/icons/crown';

	let { data } = $props();

	const events = useQuery(api.events.listMine, {});
	const firstName = $derived(data.user.name.split(' ')[0]);
</script>

<svelte:head>
	<title>Feste — skol</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex items-end justify-between gap-4">
		<div>
			<p
				class="text-ember/80 text-[10px] tracking-[0.36em] uppercase"
				style="font-family: var(--font-display);"
			>
				Skål, {firstName}
			</p>
			<h1
				class="text-foreground mt-2 leading-[1.05] font-medium tracking-[-0.02em]"
				style="font-family: var(--font-display); font-size: clamp(1.8rem, 6vw, 2.6rem);"
			>
				Deine Feste
			</h1>
		</div>
		<a
			href="/events/new"
			class="group from-ember to-ember-bright text-background inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-linear-to-br px-5 text-[11px] font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.02]"
			style="font-family: var(--font-display); box-shadow: 0 8px 28px -8px color-mix(in oklch, var(--ember) 55%, transparent);"
		>
			<Plus class="size-4" />
			<span class="hidden sm:inline">Neues Fest</span>
			<span class="sm:hidden">Fest</span>
		</a>
	</div>

	{#if events.isLoading}
		<div class="grid gap-4">
			{#each Array(3) as _}
				<div class="border-ember/10 bg-card/30 h-36 animate-pulse rounded-2xl border"></div>
			{/each}
		</div>
	{:else if events.error}
		<p class="text-destructive text-sm">Feste konnten nicht geladen werden. Lade die Seite neu.</p>
	{:else if events.data.length === 0}
		<div
			class="border-ember/15 bg-card/30 flex flex-col items-center gap-4 rounded-2xl border px-6 py-14 text-center backdrop-blur-sm"
		>
			<span
				class="border-ember/25 bg-ember/10 text-ember flex size-14 items-center justify-center rounded-full border"
			>
				<Flame class="size-6" />
			</span>
			<p class="text-foreground text-xl" style="font-family: var(--font-display);">
				Noch brennt kein Feuer
			</p>
			<p
				class="text-foreground/70 max-w-sm text-sm leading-relaxed italic"
				style="font-family: var(--font-body);"
			>
				Entfache dein erstes Fest — oder warte, bis dich jemand als Gast einlädt.
			</p>
			<a
				href="/events/new"
				class="border-ember/30 bg-ember/5 text-ember hover:bg-ember/10 mt-2 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-colors"
				style="font-family: var(--font-display);"
			>
				<Plus class="size-3.5" />
				Fest entfachen
			</a>
		</div>
	{:else}
		<ul class="grid gap-4">
			{#each events.data as event (event._id)}
				{@const phase = eventPhase(event.startDate, event.endDate)}
				{@const cover = imageUrl(event.imageKey)}
				<li>
					<a
						href="/events/{event._id}"
						class="group border-ember/12 bg-card/30 hover:border-ember/35 hover:bg-card/50 relative block overflow-hidden rounded-2xl border backdrop-blur-sm transition-all
							{phase === 'past' ? 'opacity-60 saturate-50' : ''}"
					>
						<div class="relative h-32 overflow-hidden sm:h-40">
							{#if cover}
								<img
									src={cover}
									alt=""
									class="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
								/>
								<div
									class="absolute inset-0"
									style="background: linear-gradient(to top, var(--card) 2%, transparent 60%);"
								></div>
							{:else}
								<div
									class="absolute inset-0"
									style="background:
										radial-gradient(ellipse at 30% 120%, color-mix(in oklch, var(--ember) 30%, transparent), transparent 60%),
										radial-gradient(ellipse at 80% -20%, color-mix(in oklch, var(--forest) 25%, transparent), transparent 55%),
										var(--card);"
								></div>
								<Flame
									class="text-ember/25 absolute right-5 bottom-3 size-16 transition-transform duration-700 group-hover:scale-110"
								/>
							{/if}

							<span
								class="absolute top-3 left-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] tracking-[0.24em] uppercase backdrop-blur-md
									{phase === 'running'
									? 'border-ember/50 bg-ember/20 text-ember-bright'
									: 'border-white/10 bg-black/30 text-foreground/80'}"
								style="font-family: var(--font-display);"
							>
								{#if phase === 'running'}
									<span class="bg-ember-bright relative inline-block size-1.5 rounded-full">
										<span
											class="bg-ember-bright absolute inset-0 animate-ping rounded-full opacity-70"
										></span>
									</span>
								{/if}
								{phaseLabel(event.startDate, event.endDate)}
							</span>

							{#if event.role === 'admin'}
								<span
									class="border-ember/40 bg-black/30 text-ember absolute top-3 right-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] tracking-[0.24em] uppercase backdrop-blur-md"
									style="font-family: var(--font-display);"
								>
									<Crown class="size-3" />
									Du planst
								</span>
							{/if}
						</div>

						<div class="relative px-5 pt-1 pb-4">
							<h2
								class="text-foreground text-xl leading-tight font-medium sm:text-2xl"
								style="font-family: var(--font-display);"
							>
								{event.name}
							</h2>
							<p
								class="text-ember/90 mt-1 text-[11px] tracking-[0.22em] uppercase"
								style="font-family: var(--font-display);"
							>
								{formatRange(event.startDate, event.endDate)}
							</p>
							{#if event.brief}
								<p
									class="text-foreground/70 mt-2 line-clamp-2 text-sm leading-relaxed"
									style="font-family: var(--font-body);"
								>
									{event.brief}
								</p>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
