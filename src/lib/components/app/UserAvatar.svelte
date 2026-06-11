<script lang="ts">
	import { imageUrl, initials } from '$lib/format';

	let {
		name,
		image,
		class: className = 'size-9'
	}: { name: string; image?: string | null; class?: string } = $props();

	const src = $derived(imageUrl(image));
</script>

<span
	class="border-ember/25 bg-bark text-ember relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border {className}"
>
	{#if src}
		<img {src} alt={name} class="size-full object-cover" referrerpolicy="no-referrer" />
	{:else}
		<span class="text-[0.65em] font-semibold tracking-wider" style="font-family: var(--font-display);">
			{initials(name)}
		</span>
	{/if}
</span>
