<script lang="ts">
	import { marked } from 'marked';
	import DOMPurify from 'isomorphic-dompurify';

	let { content }: { content: string } = $props();

	const html = $derived(
		DOMPurify.sanitize(marked.parse(content, { async: false, breaks: true }) as string)
	);
</script>

<div class="md-content">
	<!-- eslint-disable-next-line svelte/no-at-html-tags — sanitized above -->
	{@html html}
</div>

<style>
	.md-content {
		font-family: var(--font-body);
		color: color-mix(in oklch, var(--foreground) 85%, transparent);
		line-height: 1.75;
		font-size: 1rem;
		overflow-wrap: break-word;
	}
	.md-content :global(h1),
	.md-content :global(h2),
	.md-content :global(h3),
	.md-content :global(h4) {
		font-family: var(--font-display);
		color: var(--foreground);
		font-weight: 500;
		line-height: 1.2;
		margin: 1.5em 0 0.5em;
	}
	.md-content :global(h1:first-child),
	.md-content :global(h2:first-child),
	.md-content :global(h3:first-child),
	.md-content :global(p:first-child) {
		margin-top: 0;
	}
	.md-content :global(h1) {
		font-size: 1.5rem;
	}
	.md-content :global(h2) {
		font-size: 1.3rem;
	}
	.md-content :global(h3) {
		font-size: 1.1rem;
	}
	.md-content :global(p) {
		margin: 0.75em 0;
	}
	.md-content :global(a) {
		color: var(--ember);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: color-mix(in oklch, var(--ember) 45%, transparent);
	}
	.md-content :global(ul),
	.md-content :global(ol) {
		margin: 0.75em 0;
		padding-left: 1.4em;
	}
	.md-content :global(ul) {
		list-style: none;
	}
	.md-content :global(ul li::before) {
		content: '◆';
		color: var(--ember);
		font-size: 0.6em;
		display: inline-block;
		margin-left: -1.6em;
		width: 1.6em;
		vertical-align: 0.2em;
	}
	.md-content :global(ol) {
		list-style: decimal;
	}
	.md-content :global(li) {
		margin: 0.3em 0;
	}
	.md-content :global(blockquote) {
		border-left: 2px solid var(--ember);
		padding-left: 1em;
		margin: 1em 0;
		font-style: italic;
		color: color-mix(in oklch, var(--foreground) 70%, transparent);
	}
	.md-content :global(hr) {
		border: none;
		height: 1px;
		margin: 1.5em 0;
		background: linear-gradient(90deg, transparent, var(--ember) 50%, transparent);
		opacity: 0.5;
	}
	.md-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		background: color-mix(in oklch, var(--bark) 60%, transparent);
		border-radius: 4px;
		padding: 0.15em 0.4em;
	}
	.md-content :global(pre) {
		background: color-mix(in oklch, var(--bark) 50%, transparent);
		border: 1px solid color-mix(in oklch, var(--ember) 15%, transparent);
		border-radius: 12px;
		padding: 0.9em 1em;
		overflow-x: auto;
		margin: 1em 0;
	}
	.md-content :global(pre code) {
		background: none;
		padding: 0;
	}
	.md-content :global(strong) {
		color: var(--foreground);
		font-weight: 600;
	}
	.md-content :global(img) {
		border-radius: 12px;
		max-width: 100%;
	}
	.md-content :global(table) {
		border-collapse: collapse;
		margin: 1em 0;
		width: 100%;
		font-size: 0.925em;
	}
	.md-content :global(th),
	.md-content :global(td) {
		border: 1px solid color-mix(in oklch, var(--ember) 18%, transparent);
		padding: 0.4em 0.7em;
		text-align: left;
	}
	.md-content :global(th) {
		font-family: var(--font-display);
		font-weight: 500;
		font-size: 0.8em;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--ember);
	}
</style>
