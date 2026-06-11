<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import Markdown from '$lib/components/app/Markdown.svelte';
	import PageTitle from '$lib/components/app/PageTitle.svelte';
	import Loader from '@lucide/svelte/icons/loader';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const eventId = $derived(page.params.id as Id<'events'>);
	const isNew = $derived(page.params.pageId === 'new');
	const pageId = $derived(isNew ? null : (page.params.pageId as Id<'pages'>));

	const client = useConvexClient();
	// For existing pages, load all event pages and pick ours (no single-page query needed).
	const pages = useQuery(api.pages.forEvent, () => ({ eventId }));
	const existing = $derived(pageId ? (pages.data ?? []).find((p) => p._id === pageId) : undefined);

	let title = $state('');
	let content = $state('');
	let mode = $state<'write' | 'preview'>('write');
	let saving = $state(false);
	let confirmDelete = $state(false);
	let hydrated = $state(false);

	$effect(() => {
		if (!hydrated && existing) {
			title = existing.title;
			content = existing.content;
			hydrated = true;
		}
	});

	async function save() {
		if (!title.trim()) return toast.error('Gib der Seite einen Titel');
		saving = true;
		try {
			if (isNew) {
				await client.mutation(api.pages.create, {
					eventId,
					title: title.trim(),
					content
				});
			} else if (pageId) {
				await client.mutation(api.pages.update, { pageId, title: title.trim(), content });
			}
			toast.success('Seite gespeichert');
			await goto(`/events/${eventId}?tab=info`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!pageId) return;
		if (!confirmDelete) {
			confirmDelete = true;
			setTimeout(() => (confirmDelete = false), 3000);
			return;
		}
		try {
			await client.mutation(api.pages.remove, { pageId });
			toast.success('Seite gelöscht');
			await goto(`/events/${eventId}?tab=info`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
		}
	}
</script>

<svelte:head>
	<title>{isNew ? 'Neue Seite' : 'Seite bearbeiten'} — skol</title>
</svelte:head>

<PageTitle
	kicker={isNew ? 'Neue Seite' : 'Seite bearbeiten'}
	title={isNew ? 'Schreib es auf' : (existing?.title ?? 'Seite')}
	back={{ href: `/events/${eventId}?tab=info`, label: 'Zum Fest' }}
/>

{#if !isNew && pages.isLoading}
	<div class="border-ember/10 bg-card/30 h-96 animate-pulse rounded-2xl border"></div>
{:else if !isNew && !pages.isLoading && !existing}
	<p class="text-destructive text-sm">Diese Seite gibt es nicht.</p>
{:else}
	<div class="flex flex-col gap-5">
		<input
			class="bg-card/40 text-foreground placeholder:text-muted-foreground/60 focus:border-ember/50 focus:ring-ember/20 w-full rounded-xl border border-white/10 px-4 py-3 backdrop-blur-sm transition-colors focus:ring-2 focus:outline-none"
			style="font-family: var(--font-display); font-size: 1.1rem;"
			placeholder="Titel — z. B. Treffpunkt & Ablauf"
			maxlength="80"
			bind:value={title}
		/>

		<div
			class="flex w-fit rounded-full border border-white/10 p-1"
			style="font-family: var(--font-display);"
			role="tablist"
			aria-label="Editor-Modus"
		>
			{#each [{ id: 'write', label: 'Schreiben' }, { id: 'preview', label: 'Vorschau' }] as m (m.id)}
				<button
					role="tab"
					aria-selected={mode === m.id}
					onclick={() => (mode = m.id as typeof mode)}
					class="rounded-full px-4 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-all
						{mode === m.id ? 'bg-ember/15 text-ember' : 'text-muted-foreground hover:text-foreground'}"
				>
					{m.label}
				</button>
			{/each}
		</div>

		{#if mode === 'write'}
			<textarea
				class="bg-card/40 text-foreground placeholder:text-muted-foreground/50 focus:border-ember/50 focus:ring-ember/20 min-h-[45vh] w-full resize-y rounded-xl border border-white/10 px-4 py-3 text-sm leading-relaxed backdrop-blur-sm transition-colors focus:ring-2 focus:outline-none"
				style="font-family: var(--font-mono);"
				placeholder={'Markdown wird unterstützt:\n\n# Überschrift\n**fett**, *kursiv*\n- Liste\n\nWir treffen uns um 12 Uhr am Fluss…'}
				bind:value={content}
			></textarea>
		{:else}
			<div class="border-ember/12 bg-card/30 min-h-[45vh] rounded-xl border px-5 py-4 backdrop-blur-sm">
				{#if content.trim()}
					<Markdown {content} />
				{:else}
					<p class="text-muted-foreground text-sm italic" style="font-family: var(--font-body);">
						Noch nichts geschrieben.
					</p>
				{/if}
			</div>
		{/if}

		<div class="flex items-center gap-3">
			<button
				onclick={save}
				disabled={saving}
				class="from-ember to-ember-bright text-background inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-full bg-linear-to-br px-7 text-xs font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.01] disabled:opacity-60"
				style="font-family: var(--font-display); box-shadow: 0 10px 32px -8px color-mix(in oklch, var(--ember) 55%, transparent);"
			>
				{#if saving}<Loader class="size-4 animate-spin" />{/if}
				Speichern
			</button>
			{#if !isNew}
				<button
					onclick={remove}
					class="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-[10px] tracking-[0.18em] uppercase transition-colors
						{confirmDelete
						? 'border-destructive/60 bg-destructive/15 text-destructive'
						: 'border-white/10 text-muted-foreground hover:border-destructive/40 hover:text-destructive'}"
					style="font-family: var(--font-display);"
				>
					<Trash2 class="size-3.5" />
					{confirmDelete ? 'Sicher?' : 'Löschen'}
				</button>
			{/if}
		</div>
	</div>
{/if}
