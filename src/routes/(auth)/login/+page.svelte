<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import Atmosphere from '$lib/components/app/Atmosphere.svelte';
	import Loader from '@lucide/svelte/icons/loader';
	import Flame from '@lucide/svelte/icons/flame';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let googleLoading = $state(false);
	let emailOpen = $state(false);
	let mode = $state<'signin' | 'signup'>('signin');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let emailLoading = $state(false);

	async function handleGoogle() {
		googleLoading = true;
		try {
			await authClient.signIn.social({ provider: 'google', callbackURL: '/events' });
		} catch {
			toast.error('Anmeldung fehlgeschlagen. Versuch es nochmal.');
			googleLoading = false;
		}
	}

	async function handleEmail(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim() || !password) return toast.error('E-Mail und Passwort eingeben');
		if (mode === 'signup' && !name.trim()) return toast.error('Wie heißt du?');
		emailLoading = true;
		try {
			const result =
				mode === 'signup'
					? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
					: await authClient.signIn.email({ email: email.trim(), password });
			if (result.error) {
				toast.error(result.error.message ?? 'Das hat nicht geklappt');
				return;
			}
			await goto('/events', { invalidateAll: true });
		} catch {
			toast.error('Das hat nicht geklappt');
		} finally {
			emailLoading = false;
		}
	}

	const inputCls =
		'w-full rounded-xl border border-white/10 bg-card/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-ember/50 focus:outline-none focus:ring-2 focus:ring-ember/20 backdrop-blur-sm transition-colors text-sm' as const;
</script>

<svelte:head>
	<title>Anmelden — skol</title>
	<meta name="description" content="Melde dich bei skol an und plane Feste mit deinen Freunden." />
</svelte:head>

<div class="grain bg-background relative flex min-h-screen flex-col overflow-hidden">
	<Atmosphere embers={28} />

	<main
		class="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16"
	>
		<a
			href="/"
			class="group text-muted-foreground hover:text-foreground mb-10 inline-flex items-center gap-2 transition-colors"
			style="font-family: var(--font-display);"
		>
			<ArrowLeft class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span class="text-[10px] tracking-[0.28em] uppercase">Zur Startseite</span>
		</a>

		<div
			class="animate-fade-up border-ember/20 bg-ember/5 text-ember inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-[0.32em] uppercase backdrop-blur-sm"
			style="font-family: var(--font-display); animation-delay: 0.1s;"
		>
			<Flame class="size-3.5 animate-pulse" />
			Tritt ans Feuer
		</div>

		<h1
			class="animate-fade-up from-ember-bright via-ember to-ember mt-6 bg-linear-to-br bg-clip-text leading-none font-black tracking-[-0.03em] lowercase text-transparent"
			style="font-family: var(--font-display); font-size: clamp(3rem, 16vw, 4.5rem); animation-delay: 0.25s;"
		>
			skol
		</h1>

		<p
			class="animate-fade-up text-foreground/75 mt-4 text-center text-sm leading-relaxed italic sm:text-base"
			style="font-family: var(--font-body); animation-delay: 0.4s;"
		>
			Melde dich an, um mitzuplanen — Listen, Infos und Feste, live mit allen.
		</p>

		<div class="animate-fade-up mt-10 w-full" style="animation-delay: 0.55s;">
			<button
				onclick={handleGoogle}
				disabled={googleLoading}
				class="group from-ember to-ember-bright text-background relative inline-flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-linear-to-br px-7 text-xs font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.01] disabled:opacity-60"
				style="font-family: var(--font-display); box-shadow: 0 12px 36px -8px color-mix(in oklch, var(--ember) 60%, transparent);"
			>
				{#if googleLoading}
					<Loader class="size-4 animate-spin" />
				{:else}
					<svg class="size-4" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill="currentColor"
							d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81"
						/>
					</svg>
					Mit Google anmelden
				{/if}
			</button>

			<div class="my-6 flex items-center gap-4">
				<span class="h-px flex-1 bg-white/10"></span>
				<span
					class="text-muted-foreground/70 text-[9px] tracking-[0.3em] uppercase"
					style="font-family: var(--font-display);"
				>
					oder
				</span>
				<span class="h-px flex-1 bg-white/10"></span>
			</div>

			{#if !emailOpen}
				<button
					onclick={() => (emailOpen = true)}
					class="bg-card/40 hover:border-ember/40 hover:bg-card/70 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-white/8 text-[11px] tracking-[0.2em] uppercase backdrop-blur-md transition-all"
					style="font-family: var(--font-display);"
				>
					<Mail class="text-ember size-4" />
					Mit E-Mail anmelden
				</button>
			{:else}
				<form onsubmit={handleEmail} class="flex flex-col gap-3">
					{#if mode === 'signup'}
						<input
							class={inputCls}
							style="font-family: var(--font-body);"
							placeholder="Dein Name"
							autocomplete="name"
							bind:value={name}
						/>
					{/if}
					<input
						type="email"
						class={inputCls}
						style="font-family: var(--font-body);"
						placeholder="E-Mail"
						autocomplete="email"
						bind:value={email}
					/>
					<input
						type="password"
						class={inputCls}
						style="font-family: var(--font-body);"
						placeholder="Passwort"
						autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
						bind:value={password}
					/>
					<button
						type="submit"
						disabled={emailLoading}
						class="bg-card/60 border-ember/30 text-ember hover:bg-ember/10 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border text-[11px] tracking-[0.2em] uppercase transition-all disabled:opacity-60"
						style="font-family: var(--font-display);"
					>
						{#if emailLoading}<Loader class="size-4 animate-spin" />{/if}
						{mode === 'signup' ? 'Konto erstellen' : 'Anmelden'}
					</button>
					<button
						type="button"
						onclick={() => (mode = mode === 'signup' ? 'signin' : 'signup')}
						class="text-muted-foreground hover:text-ember mt-1 text-xs underline-offset-4 transition-colors hover:underline"
						style="font-family: var(--font-body);"
					>
						{mode === 'signup' ? 'Schon ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
					</button>
				</form>
			{/if}
		</div>
	</main>

	<footer
		class="relative z-10 px-6 py-6 text-center"
		style="font-family: var(--font-display);"
	>
		<span class="text-muted-foreground/50 text-[9px] tracking-[0.3em] uppercase">
			skol · skål — auf gute Feste
		</span>
	</footer>
</div>
