<script lang="ts">
	import { onMount } from 'svelte';

	let { embers: emberCount = 18 }: { embers?: number } = $props();

	let embers = $state<
		Array<{ left: number; size: number; delay: number; dur: number; drift: number; hue: number }>
	>([]);

	onMount(() => {
		embers = Array.from({ length: emberCount }, () => ({
			left: Math.random() * 100,
			size: 2 + Math.random() * 4,
			delay: Math.random() * 10,
			dur: 10 + Math.random() * 10,
			drift: -80 + Math.random() * 160,
			hue: -10 + Math.random() * 20
		}));
	});
</script>

<!-- Fixed full-screen campfire atmosphere: glow pools, vignette, rising embers. -->
<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
	<div
		class="animate-fire-pulse absolute top-1/2 left-1/2 size-[min(120vw,1100px)] rounded-full opacity-35 blur-[120px]"
		style="background: radial-gradient(circle, var(--ember) 0%, transparent 60%);"
	></div>
	<div
		class="absolute -top-40 -left-40 size-105 rounded-full opacity-20 blur-[110px]"
		style="background: radial-gradient(circle, var(--forest), transparent 70%);"
	></div>
	<div
		class="absolute -right-32 bottom-1/4 size-96 rounded-full opacity-15 blur-[100px]"
		style="background: radial-gradient(circle, var(--wood), transparent 70%);"
	></div>
	<div
		class="absolute inset-0"
		style="background: radial-gradient(ellipse at center, transparent 40%, color-mix(in oklch, var(--background) 75%, transparent) 100%);"
	></div>

	<div class="ember-stage absolute inset-0">
		{#each embers as e}
			<span
				class="ember"
				style="left: {e.left}%; width: {e.size}px; height: {e.size}px; --delay: {e.delay}s; --dur: {e.dur}s; --drift: {e.drift}px; filter: hue-rotate({e.hue}deg);"
			></span>
		{/each}
	</div>
</div>
