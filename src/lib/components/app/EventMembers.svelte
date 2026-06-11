<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import UserAvatar from './UserAvatar.svelte';
	import Crown from '@lucide/svelte/icons/crown';
	import X from '@lucide/svelte/icons/x';
	import UserPlus from '@lucide/svelte/icons/user-plus';

	let { eventId, role }: { eventId: Id<'events'>; role: 'guest' | 'admin' } = $props();

	const client = useConvexClient();
	const members = useQuery(api.members.forEvent, () => ({ eventId }));

	let email = $state('');
	let adding = $state(false);
	let confirmRemove = $state<Id<'eventMembers'> | null>(null);

	function fail(e: unknown) {
		toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
	}

	async function add() {
		const value = email.trim();
		if (!value) return;
		adding = true;
		try {
			await client.mutation(api.members.add, { eventId, email: value });
			email = '';
			toast.success('Gast hinzugefügt');
		} catch (e) {
			fail(e);
		} finally {
			adding = false;
		}
	}

	async function toggleRole(memberId: Id<'eventMembers'>, current: 'guest' | 'admin') {
		try {
			await client.mutation(api.members.setRole, {
				memberId,
				role: current === 'admin' ? 'guest' : 'admin'
			});
		} catch (e) {
			fail(e);
		}
	}

	async function remove(memberId: Id<'eventMembers'>) {
		if (confirmRemove !== memberId) {
			confirmRemove = memberId;
			setTimeout(() => (confirmRemove = null), 3000);
			return;
		}
		confirmRemove = null;
		try {
			await client.mutation(api.members.remove, { memberId });
		} catch (e) {
			fail(e);
		}
	}
</script>

{#if members.isLoading}
	<div class="border-ember/10 bg-card/30 h-48 animate-pulse rounded-2xl border"></div>
{:else if members.error}
	<p class="text-destructive text-sm">Gäste konnten nicht geladen werden.</p>
{:else}
	<div class="flex flex-col gap-5">
		<section class="border-ember/12 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm">
			<ul>
				{#each members.data as member, i (member._id)}
					<li
						class="flex items-center gap-3 px-5 py-3 {i !== 0 ? 'border-t border-white/5' : ''}"
					>
						<UserAvatar name={member.name} image={member.image} class="size-10" />
						<div class="min-w-0 flex-1">
							<p
								class="text-foreground truncate text-[15px] font-medium"
								style="font-family: var(--font-body);"
							>
								{member.name}
							</p>
							<p
								class="text-[10px] tracking-[0.22em] uppercase {member.role === 'admin'
									? 'text-ember'
									: 'text-muted-foreground'}"
								style="font-family: var(--font-display);"
							>
								{member.role === 'admin' ? 'Gastgeber·in' : 'Gast'}
							</p>
						</div>

						{#if role === 'admin'}
							<button
								onclick={() => toggleRole(member._id, member.role)}
								class="flex size-8 items-center justify-center rounded-full border transition-all
									{member.role === 'admin'
									? 'border-ember/50 bg-ember/15 text-ember'
									: 'border-white/10 text-muted-foreground hover:border-ember/40 hover:text-ember'}"
								aria-label={member.role === 'admin'
									? 'Zum Gast zurückstufen'
									: 'Zur Gastgeber·in machen'}
							>
								<Crown class="size-4" />
							</button>
							<button
								onclick={() => remove(member._id)}
								class="flex size-8 items-center justify-center rounded-full transition-colors
									{confirmRemove === member._id
									? 'text-destructive bg-destructive/10'
									: 'text-muted-foreground/50 hover:text-destructive'}"
								aria-label={confirmRemove === member._id
									? 'Wirklich entfernen? Nochmal tippen'
									: 'Gast entfernen'}
							>
								<X class="size-4" />
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		{#if role === 'admin'}
			<div class="border-ember/20 bg-card/20 rounded-2xl border border-dashed px-5 py-4">
				<div class="flex items-center gap-3">
					<UserPlus class="text-ember size-5 shrink-0" />
					<input
						type="email"
						class="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent focus:outline-none"
						style="font-family: var(--font-body);"
						placeholder="E-Mail-Adresse des Gasts"
						bind:value={email}
						onkeydown={(e) => e.key === 'Enter' && add()}
					/>
					<button
						onclick={add}
						disabled={adding}
						class="border-ember/30 bg-ember/5 text-ember hover:bg-ember/15 shrink-0 rounded-full border px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors disabled:opacity-60"
						style="font-family: var(--font-display);"
					>
						Einladen
					</button>
				</div>
				<p
					class="text-muted-foreground/70 mt-2 pl-8 text-xs italic"
					style="font-family: var(--font-body);"
				>
					Die Person muss sich vorher bei skol angemeldet haben.
				</p>
			</div>
		{/if}
	</div>
{/if}
