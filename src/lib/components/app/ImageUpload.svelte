<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { imageUrl } from '$lib/format';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Loader from '@lucide/svelte/icons/loader';

	let {
		value = null,
		onUploaded,
		label = 'Bild wählen',
		shape = 'banner'
	}: {
		/** Current R2 key or external URL (preview). */
		value?: string | null;
		onUploaded: (key: string) => void;
		label?: string;
		shape?: 'banner' | 'avatar';
	} = $props();

	let uploading = $state(false);
	let fileInput: HTMLInputElement | null = $state(null);

	const preview = $derived(imageUrl(value));

	async function upload(file: File) {
		uploading = true;
		try {
			const form = new FormData();
			form.append('file', file);
			const res = await fetch('/api/images', { method: 'POST', body: form });
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Upload fehlgeschlagen');
			}
			const { key } = await res.json();
			onUploaded(key);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Upload fehlgeschlagen');
		} finally {
			uploading = false;
		}
	}

	function onChange(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (file) upload(file);
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
	class="hidden"
	onchange={onChange}
/>

<button
	type="button"
	onclick={() => fileInput?.click()}
	disabled={uploading}
	class="group border-ember/20 bg-card/30 hover:border-ember/45 relative block overflow-hidden border backdrop-blur-sm transition-all disabled:opacity-60
		{shape === 'avatar' ? 'mx-auto size-28 rounded-full' : 'aspect-21/9 w-full rounded-2xl'}"
	aria-label={label}
>
	{#if preview}
		<img src={preview} alt="" class="absolute inset-0 size-full object-cover" />
		<span
			class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
		>
			<ImagePlus class="text-parchment size-6" />
		</span>
	{:else}
		<span class="text-muted-foreground flex size-full flex-col items-center justify-center gap-2">
			<ImagePlus class="text-ember/70 size-6" />
			<span
				class="text-[10px] tracking-[0.22em] uppercase"
				style="font-family: var(--font-display);"
			>
				{label}
			</span>
		</span>
	{/if}

	{#if uploading}
		<span class="absolute inset-0 flex items-center justify-center bg-black/50">
			<Loader class="text-ember size-6 animate-spin" />
		</span>
	{/if}
</button>
