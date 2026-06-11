<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import Markdown from './Markdown.svelte';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';

	let { eventId, role }: { eventId: Id<'events'>; role: 'guest' | 'admin' } = $props();

	const pages = useQuery(api.pages.forEvent, () => ({ eventId }));
</script>

{#if pages.isLoading}
	<div class="border-ember/10 bg-card/30 h-48 animate-pulse rounded-2xl border"></div>
{:else if pages.error}
	<p class="text-destructive text-sm">Seiten konnten nicht geladen werden.</p>
{:else}
	<div class="flex flex-col gap-5">
		{#if pages.data.length === 0}
			<div
				class="border-ember/15 bg-card/30 flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center backdrop-blur-sm"
			>
				<ScrollText class="text-ember/50 size-8" />
				<p class="text-foreground text-lg" style="font-family: var(--font-display);">
					Noch keine Infos
				</p>
				<p class="text-foreground/65 max-w-sm text-sm italic" style="font-family: var(--font-body);">
					{role === 'admin'
						? 'Schreib die erste Seite — Treffpunkt, Ablauf, was mitzubringen ist.'
						: 'Die Gastgeber haben noch nichts aufgeschrieben.'}
				</p>
			</div>
		{/if}

		{#each pages.data as page (page._id)}
			<article
				class="border-ember/12 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm"
			>
				<header class="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
					<h3
						class="text-foreground min-w-0 truncate text-lg font-medium"
						style="font-family: var(--font-display);"
					>
						{page.title}
					</h3>
					{#if role === 'admin'}
						<a
							href="/events/{eventId}/pages/{page._id}"
							class="text-muted-foreground hover:text-ember flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
							aria-label="Seite bearbeiten"
						>
							<Pencil class="size-4" />
						</a>
					{/if}
				</header>
				<div class="px-5 py-4">
					<Markdown content={page.content} />
				</div>
			</article>
		{/each}

		{#if role === 'admin'}
			<a
				href="/events/{eventId}/pages/new"
				class="border-ember/20 bg-card/20 text-ember hover:bg-ember/5 flex items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-4 text-[11px] tracking-[0.2em] uppercase transition-colors"
				style="font-family: var(--font-display);"
			>
				<Plus class="size-4" />
				Neue Seite schreiben
			</a>
		{/if}
	</div>
{/if}
