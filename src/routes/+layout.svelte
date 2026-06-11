<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	import { Toaster } from '$lib/components/ui/sonner';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';

	let { children, data } = $props();

	createSvelteAuthClient({
		authClient,
		convexUrl: PUBLIC_CONVEX_URL,
		getServerState: () => data.authState
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<TooltipProvider>
	{@render children()}
</TooltipProvider>
<Toaster richColors theme="dark" />
