<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Loader from '@lucide/svelte/icons/loader';

	const client = useConvexClient();
	const tokens = useQuery(api.apiTokens.listMine, {});

	let name = $state('');
	let minting = $state(false);
	let freshToken = $state<{ name: string; token: string } | null>(null);
	let confirmRevoke = $state<Id<'apiTokens'> | null>(null);

	const dateFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });

	async function mint() {
		const trimmed = name.trim();
		if (!trimmed) return toast.error('Gib dem Schlüssel einen Namen');
		minting = true;
		try {
			// Minting goes through the server route: token generation needs Node crypto.
			const res = await fetch('/api/v1/tokens', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: trimmed })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Das hat nicht geklappt');
			}
			const { data } = await res.json();
			freshToken = { name: data.name, token: data.token };
			name = '';
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
		} finally {
			minting = false;
		}
	}

	async function copyToken() {
		if (!freshToken) return;
		await navigator.clipboard.writeText(freshToken.token);
		toast.success('Kopiert');
	}

	async function revoke(tokenId: Id<'apiTokens'>) {
		if (confirmRevoke !== tokenId) {
			confirmRevoke = tokenId;
			setTimeout(() => (confirmRevoke = null), 3000);
			return;
		}
		confirmRevoke = null;
		try {
			await client.mutation(api.apiTokens.revoke, { tokenId });
			toast.success('Schlüssel widerrufen');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Das hat nicht geklappt');
		}
	}
</script>

<section class="border-ember/12 bg-card/30 rounded-2xl border px-5 py-5 backdrop-blur-sm">
	<div class="flex items-center gap-2.5">
		<KeyRound class="text-ember size-4" />
		<h2
			class="text-ember/80 text-[10px] tracking-[0.28em] uppercase"
			style="font-family: var(--font-display);"
		>
			API-Schlüssel für Agenten
		</h2>
	</div>
	<p class="text-muted-foreground/80 mt-2 text-xs leading-relaxed" style="font-family: var(--font-body);">
		Damit kann z. B. ein Planungs-Agent (MCP) in deinem Namen Listen führen. Der Schlüssel hat
		dieselben Rechte wie du — behandle ihn wie ein Passwort.
	</p>

	{#if freshToken}
		<div class="border-ember/40 bg-ember/10 mt-4 rounded-xl border px-4 py-3">
			<p
				class="text-ember text-[10px] tracking-[0.24em] uppercase"
				style="font-family: var(--font-display);"
			>
				„{freshToken.name}" — nur jetzt sichtbar!
			</p>
			<div class="mt-2 flex items-center gap-2">
				<code
					class="text-foreground/90 bg-background/50 min-w-0 flex-1 overflow-x-auto rounded-lg px-3 py-2 text-xs break-all"
					style="font-family: var(--font-mono);"
				>
					{freshToken.token}
				</code>
				<button
					onclick={copyToken}
					class="border-ember/40 bg-card/50 text-ember hover:bg-ember/15 flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors"
					aria-label="Token kopieren"
				>
					<Copy class="size-4" />
				</button>
			</div>
			<button
				onclick={() => (freshToken = null)}
				class="text-muted-foreground hover:text-foreground mt-2 text-xs underline-offset-2 hover:underline"
				style="font-family: var(--font-body);"
			>
				Ich habe ihn gespeichert — ausblenden
			</button>
		</div>
	{/if}

	{#if tokens.data && tokens.data.length > 0}
		<ul class="mt-4 flex flex-col">
			{#each tokens.data as token, i (token._id)}
				<li
					class="flex items-center gap-3 py-2.5 {i !== 0 ? 'border-t border-white/5' : ''}"
				>
					<div class="min-w-0 flex-1">
						<p class="text-foreground truncate text-sm" style="font-family: var(--font-body);">
							{token.name}
						</p>
						<p class="text-muted-foreground text-xs" style="font-family: var(--font-mono);">
							{token.prefix}… · {dateFmt.format(token._creationTime)}
						</p>
					</div>
					<button
						onclick={() => revoke(token._id)}
						class="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors
							{confirmRevoke === token._id
							? 'text-destructive bg-destructive/10'
							: 'text-muted-foreground/60 hover:text-destructive'}"
						aria-label={confirmRevoke === token._id
							? 'Wirklich widerrufen? Nochmal tippen'
							: 'Schlüssel widerrufen'}
					>
						<Trash2 class="size-4" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-4 flex gap-2">
		<input
			class="bg-card/50 text-foreground placeholder:text-muted-foreground/50 focus:border-ember/50 focus:ring-ember/20 min-w-0 flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
			style="font-family: var(--font-body);"
			placeholder="Name — z. B. WhatsApp-Agent"
			maxlength="60"
			bind:value={name}
			onkeydown={(e) => e.key === 'Enter' && mint()}
		/>
		<button
			onclick={mint}
			disabled={minting}
			class="border-ember/30 bg-ember/5 text-ember hover:bg-ember/15 shrink-0 rounded-xl border px-4 text-[10px] tracking-[0.18em] uppercase transition-colors disabled:opacity-60"
			style="font-family: var(--font-display);"
		>
			{#if minting}<Loader class="size-3.5 animate-spin" />{:else}Erstellen{/if}
		</button>
	</div>
</section>
