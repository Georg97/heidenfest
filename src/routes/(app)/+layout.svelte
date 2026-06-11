<script lang="ts">
	import Atmosphere from '$lib/components/app/Atmosphere.svelte';
	import AppHeader from '$lib/components/app/AppHeader.svelte';

	let { children, data } = $props();
</script>

<div class="grain bg-background relative flex min-h-screen flex-col">
	<Atmosphere />
	<AppHeader user={data.user} />
	<main class="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
		{@render children()}
	</main>
	<footer
		class="relative z-10 border-t border-white/5 px-4 py-5 text-center"
		style="font-family: var(--font-display);"
	>
		<span class="text-muted-foreground/50 text-[9px] tracking-[0.3em] uppercase">
			skol · skål — auf gute Feste
		</span>
	</footer>
</div>
