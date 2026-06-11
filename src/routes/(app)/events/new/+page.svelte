<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import EventForm from '$lib/components/app/EventForm.svelte';
	import PageTitle from '$lib/components/app/PageTitle.svelte';

	const client = useConvexClient();
</script>

<svelte:head>
	<title>Neues Fest — skol</title>
</svelte:head>

<PageTitle
	kicker="Neues Fest"
	title="Entfache ein Feuer"
	back={{ href: '/events', label: 'Alle Feste' }}
/>

<EventForm
	submitLabel="Fest entfachen"
	onSubmit={async (values) => {
		const eventId = await client.mutation(api.events.create, values);
		await goto(`/events/${eventId}`);
	}}
/>
