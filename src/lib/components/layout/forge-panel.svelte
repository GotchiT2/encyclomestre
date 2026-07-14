<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className,
		as = 'section',
		flat = false
	}: {
		children: Snippet;
		class?: string;
		as?: 'section' | 'article' | 'div';
		flat?: boolean;
	} = $props();
</script>

<svelte:element this={as} class={cn(flat ? 'forge-panel-flat' : 'forge-panel', className)}>
	{@render children()}
</svelte:element>
