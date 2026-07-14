<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { CardRarity } from '$lib/types';

	type RarityOption = { value: CardRarity; initials?: string; color: string };

	let {
		options,
		selected = $bindable<CardRarity[]>([]),
		name,
		onChange
	}: {
		options: RarityOption[];
		selected: CardRarity[];
		name?: string;
		onChange?: () => void;
	} = $props();

	function toggle(value: CardRarity) {
		selected = selected.includes(value)
			? selected.filter((rarity) => rarity !== value)
			: [...selected, value];
		onChange?.();
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each options as option (option.value)}
		{@const active = selected.includes(option.value)}
		<button
			type="button"
			class="relative flex min-h-11 items-center gap-2 border px-3 text-[10px] font-bold tracking-wider uppercase transition-[background-color,border-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring"
			class:text-foreground={active}
			class:text-muted-foreground={!active}
			class:scale-[1.02]={active}
			style={`--rarity-color:${option.color};border-color:${active ? option.color : `color-mix(in srgb, ${option.color} 35%, transparent)`};background:${active ? `color-mix(in srgb, ${option.color} 26%, #07111c)` : 'rgb(5 10 18 / 62%)'};box-shadow:${active ? `inset 0 0 20px color-mix(in srgb, ${option.color} 18%, transparent), 0 0 0 1px ${option.color}` : 'none'}`}
			aria-pressed={active}
			onclick={() => toggle(option.value)}
		>
			<span
				class="grid size-5 place-items-center border"
				style={`border-color:${option.color};color:${option.color}`}
			>
				{#if active}<CheckIcon class="size-3.5" />{:else}{option.initials ??
						option.value.slice(0, 2)}{/if}
			</span>
			<span>{option.value}</span>
		</button>
	{/each}
</div>

{#if name}
	{#each selected as rarity (rarity)}<input type="hidden" {name} value={rarity} />{/each}
{/if}
