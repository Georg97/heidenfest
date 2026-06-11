<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';
	import EventForm from '$lib/components/app/EventForm.svelte';
	import PageTitle from '$lib/components/app/PageTitle.svelte';

	const eventId = $derived(page.params.id as Id<'events'>);
	const client = useConvexClient();
	const event = useQuery(api.events.get, () => ({ eventId }));
</script>

<svelte:head>
	<title>Fest duplizieren — skol</title>
</svelte:head>

<PageTitle
	kicker="Duplizieren"
	title="Die Saga geht weiter"
	back={{ href: `/events/${eventId}`, label: 'Zum Fest' }}
/>

{#if event.isLoading}
	<div class="border-ember/10 bg-card/30 h-96 animate-pulse rounded-2xl border"></div>
{:else if event.error || !event.data}
	<p class="text-destructive text-sm">Fest konnte nicht geladen werden.</p>
{:else}
	<EventForm
		initial={event.data}
		submitLabel="Fest duplizieren"
		showImage={false}
		showBrief={false}
		note="Listen und Infoseiten werden übernommen — Einträge bleiben, Markierungen und Gäste nicht. Der Zeitraum darf gleich bleiben oder neu gewählt werden."
		onSubmit={async (values) => {
			const newId = await client.mutation(api.events.duplicate, {
				eventId,
				name: values.name,
				startDate: values.startDate,
				endDate: values.endDate
			});
			toast.success('Fest dupliziert — skål!');
			await goto(`/events/${newId}`);
		}}
	/>
{/if}
