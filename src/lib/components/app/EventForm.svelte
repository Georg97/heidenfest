<script lang="ts">
	import { toast } from 'svelte-sonner';
	import ImageUpload from './ImageUpload.svelte';
	import { fromDateInput, toDateInput } from '$lib/format';
	import Loader from '@lucide/svelte/icons/loader';

	export type EventFormValues = {
		name: string;
		brief: string;
		startDate: number;
		endDate: number;
		imageKey?: string;
	};

	let {
		initial,
		submitLabel,
		showImage = true,
		showBrief = true,
		note,
		onSubmit
	}: {
		initial?: Partial<EventFormValues>;
		submitLabel: string;
		showImage?: boolean;
		showBrief?: boolean;
		note?: string;
		onSubmit: (values: EventFormValues) => Promise<void>;
	} = $props();

	// The form is intentionally seeded once from `initial` (it only renders after data load).
	// svelte-ignore state_referenced_locally
	let name = $state(initial?.name ?? '');
	// svelte-ignore state_referenced_locally
	let brief = $state(initial?.brief ?? '');
	// svelte-ignore state_referenced_locally
	let start = $state(initial?.startDate ? toDateInput(initial.startDate) : '');
	// svelte-ignore state_referenced_locally
	let end = $state(initial?.endDate ? toDateInput(initial.endDate) : '');
	// svelte-ignore state_referenced_locally
	let imageKey = $state<string | undefined>(initial?.imageKey);
	let submitting = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) return toast.error('Gib dem Fest einen Namen');
		if (!start || !end) return toast.error('Wähle einen Zeitraum');
		const startDate = fromDateInput(start);
		const endDate = fromDateInput(end);
		if (endDate < startDate) return toast.error('Das Ende liegt vor dem Anfang');

		submitting = true;
		try {
			await onSubmit({ name: name.trim(), brief: brief.trim(), startDate, endDate, imageKey });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Das hat nicht geklappt');
		} finally {
			submitting = false;
		}
	}

	const labelCls =
		'text-[10px] tracking-[0.28em] uppercase text-ember/80 block mb-2' as const;
	const inputCls =
		'w-full rounded-xl border border-white/10 bg-card/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-ember/50 focus:outline-none focus:ring-2 focus:ring-ember/20 backdrop-blur-sm transition-colors' as const;
</script>

<form onsubmit={submit} class="flex flex-col gap-6">
	{#if showImage}
		<ImageUpload value={imageKey} onUploaded={(key) => (imageKey = key)} label="Festbild wählen" />
	{/if}

	<div>
		<label class={labelCls} for="event-name" style="font-family: var(--font-display);">Name</label>
		<input
			id="event-name"
			class={inputCls}
			style="font-family: var(--font-body);"
			placeholder="z. B. Heidenfest"
			maxlength="80"
			bind:value={name}
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label class={labelCls} for="event-start" style="font-family: var(--font-display);">
				Beginn
			</label>
			<input id="event-start" type="date" class="{inputCls} [color-scheme:dark]" bind:value={start} />
		</div>
		<div>
			<label class={labelCls} for="event-end" style="font-family: var(--font-display);">Ende</label>
			<input id="event-end" type="date" class="{inputCls} [color-scheme:dark]" bind:value={end} />
		</div>
	</div>

	<div class={showBrief ? '' : 'hidden'}>
		<label class={labelCls} for="event-brief" style="font-family: var(--font-display);">
			Worum geht's?
		</label>
		<textarea
			id="event-brief"
			class="{inputCls} min-h-28 resize-y"
			style="font-family: var(--font-body);"
			placeholder="Wir treffen uns und feiern zusammen in der Natur. Musik, Getränke, Lagerfeuer und Tanz."
			maxlength="500"
			bind:value={brief}
		></textarea>
	</div>

	{#if note}
		<p
			class="border-ember/15 bg-ember/5 text-foreground/75 rounded-xl border px-4 py-3 text-sm leading-relaxed italic"
			style="font-family: var(--font-body);"
		>
			{note}
		</p>
	{/if}

	<button
		type="submit"
		disabled={submitting}
		class="from-ember to-ember-bright text-background inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-linear-to-br px-7 text-xs font-semibold tracking-[0.18em] uppercase shadow-lg transition-all hover:scale-[1.01] disabled:opacity-60"
		style="font-family: var(--font-display); box-shadow: 0 10px 32px -8px color-mix(in oklch, var(--ember) 55%, transparent);"
	>
		{#if submitting}
			<Loader class="size-4 animate-spin" />
		{/if}
		{submitLabel}
	</button>
</form>
