<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		description,
		actions
	}: { eyebrow: string; title: string; description?: string; actions?: Snippet } = $props();
</script>

<header class="forge-divider relative overflow-hidden pt-2 sm:pt-4">
	<div class="absolute top-0 left-0 h-px w-28 bg-gradient-to-r from-primary to-transparent"></div>
	<div class="flex flex-wrap items-end justify-between gap-5">
		<div class="min-w-0 max-w-3xl">
			<p class="forge-label">{eyebrow}</p>
			<h1
				class="mt-2 font-serif text-4xl leading-none font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
			>
				{title}
			</h1>
			{#if description}
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
					{description}
				</p>
			{/if}
		</div>
		{#if actions}<div class="flex flex-wrap gap-2">{@render actions()}</div>{/if}
	</div>
</header>
