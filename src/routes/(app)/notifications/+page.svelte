<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import PageTitle from '$lib/components/app/PageTitle.svelte';
	import { timeAgo } from '$lib/format';
	import Bell from '@lucide/svelte/icons/bell';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import FileText from '@lucide/svelte/icons/file-text';
	import CheckCheck from '@lucide/svelte/icons/check-check';

	const client = useConvexClient();
	const notifications = useQuery(api.notifications.list, () => ({}));

	const icons: Record<string, typeof Bell> = {
		invite: UserPlus,
		event_updated: Pencil,
		list_created: ListChecks,
		page_created: FileText
	};

	const hasUnread = $derived((notifications.data ?? []).some((n) => !n.read));

	function markRead(notificationId: Id<'notifications'>) {
		// Fire and forget — navigation must not wait on it.
		client.mutation(api.notifications.markRead, { notificationId }).catch(() => {});
	}

	async function markAllRead() {
		try {
			await client.mutation(api.notifications.markAllRead, {});
		} catch {
			toast.error('Das hat nicht geklappt');
		}
	}
</script>

<svelte:head>
	<title>Mitteilungen — skol</title>
</svelte:head>

<PageTitle
	kicker="Mitteilungen"
	title="Neues vom Feuer"
	back={{ href: '/events', label: 'Alle Feste' }}
/>

{#if notifications.isLoading}
	<div class="border-ember/10 bg-card/30 h-64 animate-pulse rounded-2xl border"></div>
{:else if notifications.error}
	<p class="text-destructive text-sm">Mitteilungen konnten nicht geladen werden.</p>
{:else if notifications.data.length === 0}
	<div
		class="border-ember/12 bg-card/30 flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center backdrop-blur-sm"
	>
		<Bell class="text-ember/50 size-8" />
		<p class="text-muted-foreground text-sm italic" style="font-family: var(--font-body);">
			Noch keine Mitteilungen — wenn am Feuer etwas passiert, erfährst du es hier.
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#if hasUnread}
			<button
				onclick={markAllRead}
				class="border-ember/30 bg-ember/5 text-ember hover:bg-ember/15 inline-flex items-center gap-2 self-end rounded-full border px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors"
				style="font-family: var(--font-display);"
			>
				<CheckCheck class="size-3.5" />
				Alle als gelesen markieren
			</button>
		{/if}

		<section class="border-ember/12 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm">
			<ul>
				{#each notifications.data as notification, i (notification._id)}
					{@const Icon = icons[notification.type] ?? Bell}
					<li class={i !== 0 ? 'border-t border-white/5' : ''}>
						<a
							href={notification.eventId ? `/events/${notification.eventId}` : '/events'}
							onclick={() => !notification.read && markRead(notification._id)}
							class="flex items-start gap-3 px-5 py-4 transition-colors {notification.read
								? 'opacity-60 hover:opacity-80'
								: 'hover:bg-card/50'}"
						>
							<span
								class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border
									{notification.read
									? 'text-muted-foreground border-white/10'
									: 'border-ember/40 bg-ember/10 text-ember'}"
							>
								<Icon class="size-4" />
							</span>
							<div class="min-w-0 flex-1">
								<p
									class="text-foreground text-[15px] leading-snug {notification.read
										? ''
										: 'font-medium'}"
									style="font-family: var(--font-body);"
								>
									{notification.title}
								</p>
								{#if notification.body}
									<p
										class="text-muted-foreground mt-0.5 text-sm leading-snug"
										style="font-family: var(--font-body);"
									>
										{notification.body}
									</p>
								{/if}
								<p
									class="text-muted-foreground/70 mt-1.5 text-[10px] tracking-[0.18em] uppercase"
									style="font-family: var(--font-display);"
								>
									{timeAgo(notification._creationTime)}
								</p>
							</div>
							{#if !notification.read}
								<span class="bg-ember mt-2 size-2 shrink-0 rounded-full" aria-label="Ungelesen"
								></span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</div>
{/if}
