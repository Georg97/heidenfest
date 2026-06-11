<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import UserAvatar from '$lib/components/app/UserAvatar.svelte';
	import PageTitle from '$lib/components/app/PageTitle.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import UserX from '@lucide/svelte/icons/user-x';

	let { data } = $props();

	const client = useConvexClient();
	const users = useQuery(api.admin.listUsers, {});

	let confirmStrip = $state<Id<'users'> | null>(null);

	function fail(e: unknown) {
		toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
	}

	async function setAdmin(userId: Id<'users'>, isAppAdmin: boolean) {
		try {
			await client.mutation(api.admin.setAppAdmin, { userId, isAppAdmin });
		} catch (e) {
			fail(e);
		}
	}

	async function strip(userId: Id<'users'>) {
		if (confirmStrip !== userId) {
			confirmStrip = userId;
			setTimeout(() => (confirmStrip = null), 3000);
			return;
		}
		confirmStrip = null;
		try {
			await client.mutation(api.admin.removeUserParticipation, { userId });
			toast.success('Teilnahmen entfernt');
		} catch (e) {
			fail(e);
		}
	}
</script>

<svelte:head>
	<title>Verwaltung — skol</title>
</svelte:head>

<PageTitle kicker="Verwaltung" title="Alle am Feuer" back={{ href: '/events', label: 'Alle Feste' }} />

{#if users.isLoading}
	<div class="border-ember/10 bg-card/30 h-64 animate-pulse rounded-2xl border"></div>
{:else if users.error}
	<p class="text-destructive text-sm">Nutzer konnten nicht geladen werden.</p>
{:else}
	<section class="border-ember/12 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm">
		<ul>
			{#each users.data as user, i (user._id)}
				{@const isMe = user._id === data.user._id}
				<li class="flex items-center gap-3 px-5 py-3.5 {i !== 0 ? 'border-t border-white/5' : ''}">
					<UserAvatar name={user.name} image={user.image} class="size-10" />
					<div class="min-w-0 flex-1">
						<p
							class="text-foreground truncate text-[15px] font-medium"
							style="font-family: var(--font-body);"
						>
							{user.name}
							{#if isMe}<span class="text-muted-foreground text-xs">(du)</span>{/if}
						</p>
						<p class="text-muted-foreground truncate text-xs" style="font-family: var(--font-body);">
							{user.email}
						</p>
					</div>

					<div class="flex shrink-0 items-center gap-3">
						<label
							class="flex flex-col items-center gap-1"
							style="font-family: var(--font-display);"
						>
							<span class="text-muted-foreground text-[8px] tracking-[0.2em] uppercase">Admin</span>
							<Switch
								checked={user.isAppAdmin}
								disabled={isMe}
								onCheckedChange={(checked) => setAdmin(user._id, checked)}
							/>
						</label>
						<button
							onclick={() => strip(user._id)}
							disabled={isMe}
							class="flex size-8 items-center justify-center rounded-full transition-colors disabled:opacity-30
								{confirmStrip === user._id
								? 'text-destructive bg-destructive/10'
								: 'text-muted-foreground/60 hover:text-destructive'}"
							aria-label={confirmStrip === user._id
								? 'Wirklich alle Teilnahmen entfernen? Nochmal tippen'
								: 'Alle Teilnahmen entfernen'}
							title="Entfernt die Person aus allen Festen und Listen"
						>
							<UserX class="size-4" />
						</button>
					</div>
				</li>
			{/each}
		</ul>
	</section>
	<p
		class="text-muted-foreground/70 mt-4 text-xs leading-relaxed italic"
		style="font-family: var(--font-body);"
	>
		App-Admins können überall verwalten: Feste, Listen, Seiten und Gäste. Das Kreuz entfernt
		eine Person aus allen Festen und Listen — ihr Konto bleibt bestehen.
	</p>
{/if}
