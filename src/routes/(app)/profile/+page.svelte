<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import ImageUpload from '$lib/components/app/ImageUpload.svelte';
	import ApiTokens from '$lib/components/app/ApiTokens.svelte';
	import PageTitle from '$lib/components/app/PageTitle.svelte';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Loader from '@lucide/svelte/icons/loader';
	import Shield from '@lucide/svelte/icons/shield';

	let { data } = $props();

	// Seeded once; after saving we invalidateAll, so staleness is handled explicitly.
	// svelte-ignore state_referenced_locally
	let name = $state(data.user.name);
	let saving = $state(false);
	let signingOut = $state(false);

	async function saveName() {
		const trimmed = name.trim();
		if (!trimmed) return toast.error('Der Name darf nicht leer sein');
		if (trimmed === data.user.name) return;
		saving = true;
		try {
			await authClient.updateUser({ name: trimmed });
			await invalidateAll();
			toast.success('Name gespeichert');
		} catch {
			toast.error('Das hat nicht geklappt');
		} finally {
			saving = false;
		}
	}

	async function setImage(key: string) {
		try {
			await authClient.updateUser({ image: key });
			await invalidateAll();
			toast.success('Bild gespeichert');
		} catch {
			toast.error('Das hat nicht geklappt');
		}
	}

	async function signOut() {
		signingOut = true;
		await authClient.signOut();
		await goto('/', { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>Profil — skol</title>
</svelte:head>

<PageTitle kicker="Profil" title={data.user.name} back={{ href: '/events', label: 'Alle Feste' }} />

<div class="flex flex-col gap-6">
	<section
		class="border-ember/12 bg-card/30 flex flex-col items-center gap-4 rounded-2xl border px-6 py-8 backdrop-blur-sm"
	>
		<ImageUpload value={data.user.image} onUploaded={setImage} label="Bild" shape="avatar" />
		<p class="text-muted-foreground/80 text-xs italic" style="font-family: var(--font-body);">
			Tippe auf das Bild, um es zu ändern
		</p>
		{#if data.user.isAppAdmin}
			<span
				class="border-ember/40 bg-ember/10 text-ember inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] tracking-[0.24em] uppercase"
				style="font-family: var(--font-display);"
			>
				<Shield class="size-3" />
				App-Verwaltung
			</span>
		{/if}
	</section>

	<section class="border-ember/12 bg-card/30 rounded-2xl border px-5 py-5 backdrop-blur-sm">
		<label
			class="text-ember/80 mb-2 block text-[10px] tracking-[0.28em] uppercase"
			style="font-family: var(--font-display);"
			for="profile-name"
		>
			Name
		</label>
		<div class="flex gap-2">
			<input
				id="profile-name"
				class="bg-card/50 text-foreground focus:border-ember/50 focus:ring-ember/20 min-w-0 flex-1 rounded-xl border border-white/10 px-4 py-3 transition-colors focus:ring-2 focus:outline-none"
				style="font-family: var(--font-body);"
				maxlength="60"
				bind:value={name}
				onkeydown={(e) => e.key === 'Enter' && saveName()}
			/>
			<button
				onclick={saveName}
				disabled={saving || name.trim() === data.user.name}
				class="border-ember/30 bg-ember/5 text-ember hover:bg-ember/15 shrink-0 rounded-xl border px-4 text-[10px] tracking-[0.18em] uppercase transition-colors disabled:opacity-40"
				style="font-family: var(--font-display);"
			>
				{#if saving}<Loader class="size-3.5 animate-spin" />{:else}Speichern{/if}
			</button>
		</div>
		<p class="text-muted-foreground/70 mt-3 text-xs" style="font-family: var(--font-body);">
			Angemeldet als <span class="text-foreground/80">{data.user.email}</span>
		</p>
	</section>

	<ApiTokens />

	<button
		onclick={signOut}
		disabled={signingOut}
		class="group bg-card/40 hover:border-ember/40 hover:bg-card/70 inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-white/8 text-[11px] tracking-[0.2em] uppercase backdrop-blur-md transition-all disabled:opacity-50"
		style="font-family: var(--font-display);"
	>
		<LogOut class="text-ember size-4 transition-transform group-hover:translate-x-0.5" />
		Abmelden
	</button>
</div>
