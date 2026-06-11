<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import { formatRange, phaseLabel, imageUrl } from '$lib/format';
	import EventLists from '$lib/components/app/EventLists.svelte';
	import EventPages from '$lib/components/app/EventPages.svelte';
	import EventMembers from '$lib/components/app/EventMembers.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Flame from '@lucide/svelte/icons/flame';
	import Pencil from '@lucide/svelte/icons/pencil';
	import CopyPlus from '@lucide/svelte/icons/copy-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Users from '@lucide/svelte/icons/users';

	let { data } = $props();

	const eventId = $derived(page.params.id as Id<'events'>);
	const client = useConvexClient();
	const event = useQuery(api.events.get, () => ({ eventId }));

	const TABS = [
		{ id: 'lists', label: 'Listen', icon: ClipboardList },
		{ id: 'info', label: 'Infos', icon: ScrollText },
		{ id: 'people', label: 'Leute', icon: Users }
	] as const;
	type TabId = (typeof TABS)[number]['id'];

	const initialTab = page.url.searchParams.get('tab');
	let tab = $state<TabId>(
		initialTab === 'info' || initialTab === 'people' ? initialTab : 'lists'
	);

	let confirmDelete = $state(false);

	async function deleteEvent() {
		if (!confirmDelete) {
			confirmDelete = true;
			setTimeout(() => (confirmDelete = false), 3000);
			return;
		}
		try {
			await client.mutation(api.events.remove, { eventId });
			toast.success('Fest gelöscht');
			await goto('/events');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
		}
	}
</script>

<svelte:head>
	<title>{event.data?.name ?? 'Fest'} — skol</title>
</svelte:head>

<a
	href="/events"
	class="group text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 transition-colors"
	style="font-family: var(--font-display);"
>
	<ArrowLeft class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
	<span class="text-[10px] tracking-[0.28em] uppercase">Alle Feste</span>
</a>

{#if event.isLoading}
	<div class="border-ember/10 bg-card/30 h-56 animate-pulse rounded-2xl border"></div>
{:else if event.error || !event.data}
	<div
		class="border-ember/15 bg-card/30 flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center"
	>
		<Flame class="text-ember/50 size-8" />
		<p class="text-foreground text-lg" style="font-family: var(--font-display);">
			Dieses Fest gibt es nicht — oder du bist nicht eingeladen.
		</p>
	</div>
{:else}
	{@const ev = event.data}
	{@const cover = imageUrl(ev.imageKey)}

	<header class="border-ember/12 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm">
		<div class="relative {cover ? 'h-44 sm:h-60' : 'h-20 sm:h-24'} overflow-hidden">
			{#if cover}
				<img src={cover} alt="" class="absolute inset-0 size-full object-cover" />
				<div
					class="absolute inset-0"
					style="background: linear-gradient(to top, var(--card) 4%, transparent 65%);"
				></div>
			{:else}
				<div
					class="absolute inset-0"
					style="background:
						radial-gradient(ellipse at 25% 130%, color-mix(in oklch, var(--ember) 28%, transparent), transparent 60%),
						radial-gradient(ellipse at 85% -30%, color-mix(in oklch, var(--forest) 22%, transparent), transparent 55%);"
				></div>
			{/if}
			<span
				class="border-ember/40 bg-black/30 text-ember-bright absolute bottom-3 left-5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] tracking-[0.24em] uppercase backdrop-blur-md"
				style="font-family: var(--font-display);"
			>
				<Flame class="size-3" />
				{phaseLabel(ev.startDate, ev.endDate)}
			</span>
		</div>

		<div class="px-5 pt-3 pb-5">
			<h1
				class="text-foreground leading-tight font-medium tracking-[-0.01em]"
				style="font-family: var(--font-display); font-size: clamp(1.6rem, 6vw, 2.4rem);"
			>
				{ev.name}
			</h1>
			<p
				class="text-ember mt-1 text-[11px] tracking-[0.24em] uppercase"
				style="font-family: var(--font-display);"
			>
				{formatRange(ev.startDate, ev.endDate)}
			</p>
			{#if ev.brief}
				<p
					class="text-foreground/80 mt-3 max-w-2xl text-[15px] leading-relaxed italic"
					style="font-family: var(--font-body);"
				>
					{ev.brief}
				</p>
			{/if}

			{#if ev.role === 'admin'}
				<div class="mt-4 flex flex-wrap items-center gap-2">
					<a
						href="/events/{eventId}/edit"
						class="border-ember/25 bg-ember/5 text-ember hover:bg-ember/10 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase transition-colors"
						style="font-family: var(--font-display);"
					>
						<Pencil class="size-3" />
						Bearbeiten
					</a>
					<a
						href="/events/{eventId}/duplicate"
						class="border-ember/25 bg-ember/5 text-ember hover:bg-ember/10 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase transition-colors"
						style="font-family: var(--font-display);"
					>
						<CopyPlus class="size-3" />
						Duplizieren
					</a>
					<button
						onclick={deleteEvent}
						class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase transition-colors
							{confirmDelete
							? 'border-destructive/60 bg-destructive/15 text-destructive'
							: 'border-white/10 text-muted-foreground hover:border-destructive/40 hover:text-destructive'}"
						style="font-family: var(--font-display);"
					>
						<Trash2 class="size-3" />
						{confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
					</button>
				</div>
			{/if}
		</div>
	</header>

	<nav
		class="bg-background/70 sticky top-[57px] z-30 -mx-4 mt-6 mb-6 flex border-b border-white/5 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6"
		style="font-family: var(--font-display);"
		aria-label="Bereiche"
	>
		{#each TABS as t (t.id)}
			{@const Icon = t.icon}
			<button
				onclick={() => (tab = t.id)}
				class="relative flex flex-1 items-center justify-center gap-2 py-3.5 text-[11px] tracking-[0.22em] uppercase transition-colors
					{tab === t.id ? 'text-ember' : 'text-foreground/60 hover:text-foreground'}"
				aria-current={tab === t.id ? 'page' : undefined}
			>
				<Icon class="size-4" />
				<span class="hidden sm:inline">{t.label}</span>
				<span class="sm:hidden">{t.label}</span>
				{#if tab === t.id}
					<span
						class="absolute right-[15%] bottom-0 left-[15%] h-px"
						style="background: linear-gradient(90deg, transparent, var(--ember), transparent);"
					></span>
				{/if}
			</button>
		{/each}
	</nav>

	{#if tab === 'lists'}
		<EventLists {eventId} role={ev.role} meId={data.user._id} />
	{:else if tab === 'info'}
		<EventPages {eventId} role={ev.role} />
	{:else}
		<EventMembers {eventId} role={ev.role} />
	{/if}
{/if}
