<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import UserAvatar from './UserAvatar.svelte';
	import Shield from '@lucide/svelte/icons/shield';
	import Bell from '@lucide/svelte/icons/bell';

	let {
		user
	}: { user: { name: string; image?: string | null; isAppAdmin: boolean } } = $props();

	const unread = useQuery(api.notifications.unreadCount, () => ({}));
	const unreadCount = $derived(unread.data ?? 0);
</script>

<header class="bg-background/60 sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
	<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
		<a
			href="/events"
			class="flex items-center gap-2.5"
			style="font-family: var(--font-display);"
			aria-label="Zur Festübersicht"
		>
			<span class="bg-ember relative inline-block size-2 rounded-full">
				<span class="bg-ember absolute inset-0 animate-ping rounded-full opacity-60"></span>
			</span>
			<span class="text-foreground/90 text-base tracking-[0.32em] lowercase">skol</span>
		</a>

		<nav class="flex items-center gap-3">
			{#if user.isAppAdmin}
				<a
					href="/admin"
					class="bg-card/40 hover:border-ember/40 hover:bg-card/70 inline-flex size-9 items-center justify-center rounded-full border border-white/8 backdrop-blur-md transition-all"
					aria-label="Verwaltung"
				>
					<Shield class="text-ember size-4" />
				</a>
			{/if}
			<a
				href="/notifications"
				class="bg-card/40 hover:border-ember/40 hover:bg-card/70 relative inline-flex size-9 items-center justify-center rounded-full border border-white/8 backdrop-blur-md transition-all"
				aria-label={unreadCount > 0
					? `Mitteilungen, ${unreadCount} ungelesen`
					: 'Mitteilungen'}
			>
				<Bell class="text-ember size-4" />
				{#if unreadCount > 0}
					<span
						class="bg-ember text-background absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
						style="font-family: var(--font-display);"
					>
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				{/if}
			</a>
			<a
				href="/profile"
				class="hover:ring-ember/40 rounded-full ring-1 ring-transparent transition-all"
				aria-label="Profil"
			>
				<UserAvatar name={user.name} image={user.image} class="size-9" />
			</a>
		</nav>
	</div>
</header>
