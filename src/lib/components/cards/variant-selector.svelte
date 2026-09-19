<script lang="ts">
	import { onMount } from 'svelte';
	import { getVariants } from '$lib/api/variants';
	import type { VariantDefinition } from '$lib/types';

	let {
		selected = $bindable<number[]>([]),
		name = 'variant',
		compact = false,
		onChange
	}: {
		selected?: number[];
		name?: string;
		compact?: boolean;
		onChange?: () => void;
	} = $props();
	let variants = $state<VariantDefinition[]>([]);

	onMount(() => {
		void getVariants().then((catalogue) => (variants = catalogue));
	});

	function toggle(id: number) {
		selected = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
		onChange?.();
	}
</script>

<div class="flex flex-wrap gap-2" class:gap-1={compact}>
	{#each variants as variant (variant.id)}
		<label
			class="flex min-h-9 cursor-pointer items-center gap-2 border bg-background/55 px-3 font-mono text-[10px] font-bold uppercase tracking-wider"
			class:border-primary={selected.includes(variant.id)}
			class:border-border={!selected.includes(variant.id)}
			style={`--variant-color:${variant.color}`}
		>
			<input
				type="checkbox"
				{name}
				value={variant.id}
				checked={selected.includes(variant.id)}
				onchange={() => toggle(variant.id)}
				class="sr-only"
			/>
			<span class="size-2.5 rotate-45 border border-current" style={`color:${variant.color}`}
			></span>
			{variant.name}
		</label>
	{/each}
</div>
