<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { toast } from 'svelte-sonner';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Mail from '@lucide/svelte/icons/mail';

	let {
		user
	}: { user: { notifyInApp?: boolean | null; notifyEmail?: boolean | null } } = $props();

	const client = useConvexClient();

	// Seeded once from server data; toggles are optimistic and reverted on error.
	// svelte-ignore state_referenced_locally
	let inApp = $state(user.notifyInApp ?? true);
	// svelte-ignore state_referenced_locally
	let email = $state(user.notifyEmail ?? false);

	async function save(settings: { notifyInApp?: boolean; notifyEmail?: boolean }) {
		try {
			await client.mutation(api.notifications.updateSettings, settings);
		} catch {
			if (settings.notifyInApp !== undefined) inApp = !settings.notifyInApp;
			if (settings.notifyEmail !== undefined) email = !settings.notifyEmail;
			toast.error('Das hat nicht geklappt');
		}
	}

	function toggleInApp() {
		inApp = !inApp;
		save({ notifyInApp: inApp });
	}

	function toggleEmail() {
		email = !email;
		save({ notifyEmail: email });
	}
</script>

{#snippet toggle(on: boolean, onclick: () => void, label: string)}
	<button
		role="switch"
		aria-checked={on}
		aria-label={label}
		{onclick}
		class="relative h-6 w-11 shrink-0 rounded-full border transition-colors
			{on ? 'border-ember/50 bg-ember/30' : 'border-white/15 bg-card/60'}"
	>
		<span
			class="absolute top-0.5 left-0.5 size-[18px] rounded-full transition-transform
				{on ? 'bg-ember translate-x-5' : 'bg-muted-foreground/60'}"
		></span>
	</button>
{/snippet}

<section class="border-ember/12 bg-card/30 rounded-2xl border px-5 py-5 backdrop-blur-sm">
	<h2
		class="text-ember/80 mb-4 text-[10px] tracking-[0.28em] uppercase"
		style="font-family: var(--font-display);"
	>
		Mitteilungen
	</h2>

	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-3">
			<BellRing class="text-ember size-4 shrink-0" />
			<div class="min-w-0 flex-1">
				<p class="text-foreground text-sm" style="font-family: var(--font-body);">In der App</p>
				<p class="text-muted-foreground/70 text-xs" style="font-family: var(--font-body);">
					Einladungen, Änderungen und Neues an deinen Festen
				</p>
			</div>
			{@render toggle(inApp, toggleInApp, 'Mitteilungen in der App')}
		</div>

		<div class="flex items-center gap-3 border-t border-white/5 pt-4">
			<Mail class="text-ember size-4 shrink-0" />
			<div class="min-w-0 flex-1">
				<p class="text-foreground text-sm" style="font-family: var(--font-body);">Per E-Mail</p>
				<p class="text-muted-foreground/70 text-xs" style="font-family: var(--font-body);">
					Dieselben Mitteilungen zusätzlich ins Postfach
				</p>
			</div>
			{@render toggle(email, toggleEmail, 'Mitteilungen per E-Mail')}
		</div>
	</div>
</section>
