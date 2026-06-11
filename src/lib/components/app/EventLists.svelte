<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import UserAvatar from './UserAvatar.svelte';
	import Flame from '@lucide/svelte/icons/flame';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Loader from '@lucide/svelte/icons/loader';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';

	let {
		eventId,
		role,
		meId
	}: { eventId: Id<'events'>; role: 'guest' | 'admin'; meId: Id<'users'> } = $props();

	const client = useConvexClient();
	const lists = useQuery(api.lists.forEvent, () => ({ eventId }));
	// Target candidates for "copy list to" (only where I plan).
	const myEvents = useQuery(api.events.listMine, {});
	const copyTargets = $derived(
		(myEvents.data ?? []).filter((e) => e.role === 'admin' && e._id !== eventId)
	);

	let openEntry = $state<Id<'listEntries'> | null>(null);
	let comment = $state('');
	let busy = $state(false);

	let newListTitle = $state('');
	let newEntryTitles = $state<Record<string, string>>({});
	let confirmDeleteList = $state<Id<'lists'> | null>(null);
	let copyingList = $state<Id<'lists'> | null>(null);

	function fail(e: unknown) {
		toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
	}

	function toggleEntry(entryId: Id<'listEntries'>, existingComment?: string) {
		if (openEntry === entryId) {
			openEntry = null;
			return;
		}
		openEntry = entryId;
		comment = existingComment ?? '';
	}

	async function mark(entryId: Id<'listEntries'>) {
		busy = true;
		try {
			await client.mutation(api.lists.mark, {
				entryId,
				comment: comment.trim() || undefined
			});
			openEntry = null;
			toast.success('Eingetragen — skål!');
		} catch (e) {
			fail(e);
		} finally {
			busy = false;
		}
	}

	async function unmark(markId: Id<'entryMarks'>) {
		busy = true;
		try {
			await client.mutation(api.lists.unmark, { markId });
			openEntry = null;
		} catch (e) {
			fail(e);
		} finally {
			busy = false;
		}
	}

	async function createList() {
		const title = newListTitle.trim();
		if (!title) return;
		try {
			await client.mutation(api.lists.create, { eventId, title });
			newListTitle = '';
		} catch (e) {
			fail(e);
		}
	}

	async function addEntry(listId: Id<'lists'>) {
		const title = (newEntryTitles[listId] ?? '').trim();
		if (!title) return;
		try {
			await client.mutation(api.lists.addEntry, { listId, title });
			newEntryTitles[listId] = '';
		} catch (e) {
			fail(e);
		}
	}

	async function removeEntry(entryId: Id<'listEntries'>) {
		try {
			await client.mutation(api.lists.removeEntry, { entryId });
		} catch (e) {
			fail(e);
		}
	}

	async function deleteList(listId: Id<'lists'>) {
		if (confirmDeleteList !== listId) {
			confirmDeleteList = listId;
			setTimeout(() => (confirmDeleteList = null), 3000);
			return;
		}
		confirmDeleteList = null;
		try {
			await client.mutation(api.lists.remove, { listId });
		} catch (e) {
			fail(e);
		}
	}

	async function copyList(listId: Id<'lists'>, targetEventId: Id<'events'>) {
		try {
			await client.mutation(api.lists.copyTo, { listId, targetEventId });
			copyingList = null;
			toast.success('Liste kopiert');
		} catch (e) {
			fail(e);
		}
	}
</script>

{#if lists.isLoading}
	<div class="grid gap-4">
		{#each Array(2) as _}
			<div class="border-ember/10 bg-card/30 h-44 animate-pulse rounded-2xl border"></div>
		{/each}
	</div>
{:else if lists.error}
	<p class="text-destructive text-sm">Listen konnten nicht geladen werden.</p>
{:else}
	<div class="flex flex-col gap-5">
		{#if lists.data.length === 0}
			<div
				class="border-ember/15 bg-card/30 flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center backdrop-blur-sm"
			>
				<ClipboardList class="text-ember/50 size-8" />
				<p class="text-foreground text-lg" style="font-family: var(--font-display);">
					Noch keine Listen
				</p>
				<p
					class="text-foreground/65 max-w-sm text-sm italic"
					style="font-family: var(--font-body);"
				>
					{role === 'admin'
						? 'Leg die erste Liste an — zum Beispiel „Wer bringt was zum Grillen?"'
						: 'Sobald die Gastgeber Listen anlegen, kannst du dich hier eintragen.'}
				</p>
			</div>
		{/if}

		{#each lists.data as list (list._id)}
			<section
				class="border-ember/12 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm"
			>
				<header class="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
					<div class="min-w-0">
						<h3
							class="text-foreground truncate text-lg font-medium"
							style="font-family: var(--font-display);"
						>
							{list.title}
						</h3>
						{#if list.description}
							<p class="text-foreground/60 mt-0.5 text-xs italic" style="font-family: var(--font-body);">
								{list.description}
							</p>
						{/if}
					</div>

					{#if role === 'admin'}
						<div class="flex shrink-0 items-center gap-1">
							{#if copyTargets.length > 0}
								<button
									onclick={() => (copyingList = copyingList === list._id ? null : list._id)}
									class="text-muted-foreground hover:text-ember flex size-8 items-center justify-center rounded-full transition-colors"
									aria-label="Liste in anderes Fest kopieren"
								>
									<Copy class="size-4" />
								</button>
							{/if}
							<button
								onclick={() => deleteList(list._id)}
								class="flex size-8 items-center justify-center rounded-full transition-colors
									{confirmDeleteList === list._id
									? 'text-destructive bg-destructive/10'
									: 'text-muted-foreground hover:text-destructive'}"
								aria-label={confirmDeleteList === list._id
									? 'Wirklich löschen? Nochmal tippen'
									: 'Liste löschen'}
							>
								<Trash2 class="size-4" />
							</button>
						</div>
					{/if}
				</header>

				{#if confirmDeleteList === list._id}
					<p class="text-destructive px-5 pb-2 text-[11px] tracking-[0.14em] uppercase" style="font-family: var(--font-display);">
						Nochmal tippen zum endgültigen Löschen
					</p>
				{/if}

				{#if copyingList === list._id}
					<div class="border-ember/15 bg-ember/5 mx-4 mb-3 rounded-xl border px-4 py-3">
						<p
							class="text-ember/90 mb-2 text-[10px] tracking-[0.24em] uppercase"
							style="font-family: var(--font-display);"
						>
							Kopieren nach
						</p>
						<div class="flex flex-wrap gap-2">
							{#each copyTargets as target (target._id)}
								<button
									onclick={() => copyList(list._id, target._id)}
									class="border-ember/30 bg-card/50 text-foreground hover:bg-ember/15 rounded-full border px-3 py-1.5 text-xs transition-colors"
									style="font-family: var(--font-body);"
								>
									{target.name}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<ul>
					{#each list.entries as entry, i (entry._id)}
						{@const myMark = entry.marks.find((m) => m.userId === meId)}
						{@const isOpen = openEntry === entry._id}
						<li class={i !== 0 || true ? 'border-t border-white/5' : ''}>
							<div class="flex items-center gap-3 px-5 py-3">
								<button
									onclick={() => toggleEntry(entry._id, myMark?.comment)}
									class="group flex min-w-0 flex-1 items-center gap-3 text-left"
								>
									<span
										class="flex size-9 shrink-0 items-center justify-center rounded-lg border transition-all
											{myMark
											? 'border-ember/60 bg-ember/15 text-ember shadow-[0_0_14px_-2px_var(--ember)]'
											: entry.marks.length > 0
												? 'border-ember/25 bg-ember/5 text-ember/70'
												: 'border-white/10 bg-card/40 text-muted-foreground group-hover:border-ember/40 group-hover:text-ember'}"
									>
										<Flame class="size-4 {myMark ? 'fill-current' : ''}" />
									</span>
									<span class="min-w-0">
										<span
											class="text-foreground block truncate text-[15px] font-medium"
											style="font-family: var(--font-body);"
										>
											{entry.title}
										</span>
										{#if entry.marks.length === 0}
											<span
												class="text-muted-foreground/70 block text-xs italic"
												style="font-family: var(--font-body);"
											>
												— noch offen —
											</span>
										{/if}
									</span>
								</button>

								{#if role === 'admin'}
									<button
										onclick={() => removeEntry(entry._id)}
										class="text-muted-foreground/50 hover:text-destructive flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
										aria-label="Eintrag entfernen"
									>
										<X class="size-3.5" />
									</button>
								{/if}
							</div>

							{#if entry.marks.length > 0}
								<div class="flex flex-col gap-1.5 px-5 pb-3 pl-[4.25rem]">
									{#each entry.marks as m (m._id)}
										<div class="flex items-start gap-2">
											<UserAvatar name={m.userName} image={m.userImage} class="size-5 mt-px" />
											<p class="min-w-0 text-sm leading-snug" style="font-family: var(--font-body);">
												<span class="text-ember font-medium">{m.userName}</span>
												{#if m.comment}
													<span class="text-foreground/65 italic"> — {m.comment}</span>
												{/if}
											</p>
										</div>
									{/each}
								</div>
							{/if}

							{#if isOpen}
								<div class="border-ember/15 bg-ember/5 mx-4 mb-3 rounded-xl border px-4 py-3">
									<label
										class="text-ember/90 mb-2 block text-[10px] tracking-[0.24em] uppercase"
										style="font-family: var(--font-display);"
										for="comment-{entry._id}"
									>
										{myMark ? 'Dein Eintrag' : 'Das übernehme ich'}
									</label>
									<input
										id="comment-{entry._id}"
										class="bg-card/50 text-foreground placeholder:text-muted-foreground/50 focus:border-ember/50 focus:ring-ember/20 w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
										style="font-family: var(--font-body);"
										placeholder="Kommentar (optional) — z. B. bringe 2 Kästen"
										maxlength="200"
										bind:value={comment}
										onkeydown={(e) => e.key === 'Enter' && mark(entry._id)}
									/>
									<div class="mt-3 flex items-center gap-2">
										<button
											onclick={() => mark(entry._id)}
											disabled={busy}
											class="from-ember to-ember-bright text-background inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-linear-to-br px-4 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all disabled:opacity-60"
											style="font-family: var(--font-display);"
										>
											{#if busy}<Loader class="size-3.5 animate-spin" />{/if}
											{myMark ? 'Speichern' : 'Übernehmen'}
										</button>
										{#if myMark}
											<button
												onclick={() => unmark(myMark._id)}
												disabled={busy}
												class="border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex h-9 items-center justify-center rounded-full border px-4 text-[10px] tracking-[0.18em] uppercase transition-colors disabled:opacity-60"
												style="font-family: var(--font-display);"
											>
												Austragen
											</button>
										{/if}
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>

				{#if role === 'admin'}
					<div class="flex items-center gap-2 border-t border-white/5 px-5 py-3">
						<Plus class="text-ember/60 size-4 shrink-0" />
						<input
							class="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
							style="font-family: var(--font-body);"
							placeholder="Neuer Eintrag…"
							maxlength="120"
							bind:value={newEntryTitles[list._id]}
							onkeydown={(e) => e.key === 'Enter' && addEntry(list._id)}
						/>
						<button
							onclick={() => addEntry(list._id)}
							class="text-ember/80 hover:text-ember text-[10px] tracking-[0.2em] uppercase transition-colors"
							style="font-family: var(--font-display);"
						>
							Hinzufügen
						</button>
					</div>
				{/if}
			</section>
		{/each}

		{#if role === 'admin'}
			<div
				class="border-ember/20 bg-card/20 flex items-center gap-3 rounded-2xl border border-dashed px-5 py-4"
			>
				<Plus class="text-ember size-5 shrink-0" />
				<input
					class="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent focus:outline-none"
					style="font-family: var(--font-body);"
					placeholder="Neue Liste — z. B. Wer bringt was?"
					maxlength="80"
					bind:value={newListTitle}
					onkeydown={(e) => e.key === 'Enter' && createList()}
				/>
				<button
					onclick={createList}
					class="border-ember/30 bg-ember/5 text-ember hover:bg-ember/15 shrink-0 rounded-full border px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors"
					style="font-family: var(--font-display);"
				>
					Anlegen
				</button>
			</div>
		{/if}
	</div>
{/if}
