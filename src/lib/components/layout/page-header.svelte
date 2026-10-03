<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		description,
		actions
	}: { eyebrow?: string; title: string; description?: string; actions?: Snippet } = $props();
</script>

<header class="arcade-page-heading border-b border-border pb-4 pt-1">
	<div class="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
		<div class="min-w-0 max-w-3xl">
			{#if eyebrow}<p class="forge-label">{eyebrow}</p>{/if}
			<h1
				class="mt-1.5 font-heading text-3xl leading-none font-black tracking-tight text-foreground sm:text-4xl lg:text-4xl"
			>
				{title}
			</h1>
			{#if description}
				<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
					{description}
				</p>
			{/if}
		</div>
		{#if actions}<div class="flex flex-wrap gap-2">{@render actions()}</div>{/if}
	</div>
</header>
