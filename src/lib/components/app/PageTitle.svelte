<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let {
		kicker,
		title,
		back
	}: { kicker: string; title: string; back?: { href: string; label: string } } = $props();
</script>

<div class="mb-8 flex flex-col items-start">
	{#if back}
		<a
			href={back.href}
			class="group text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 transition-colors"
			style="font-family: var(--font-display);"
		>
			<ArrowLeft class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
			<span class="text-[10px] tracking-[0.28em] uppercase">{back.label}</span>
		</a>
	{/if}
	<p
		class="text-ember/80 text-[10px] tracking-[0.36em] uppercase"
		style="font-family: var(--font-display);"
	>
		{kicker}
	</p>
	<h1
		class="text-foreground mt-2 leading-[1.05] font-medium tracking-[-0.02em]"
		style="font-family: var(--font-display); font-size: clamp(1.7rem, 6vw, 2.4rem);"
	>
		{title}
	</h1>
	<div class="runic-divider mt-5 w-24"></div>
</div>
