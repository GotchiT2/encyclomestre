<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { CardRarity } from '$lib/types';

	type RarityOption = { value: CardRarity; initials?: string; color: string };

	let {
		options,
		selected = $bindable<CardRarity[]>([]),
		name,
		multiple = true,
		compact = false,
		onChange
	}: {
		options: RarityOption[];
		selected: CardRarity[];
		name?: string;
		multiple?: boolean;
		/** N'affiche que les abréviations : le nom complet passe en tooltip et en aria-label. */
		compact?: boolean;
		onChange?: () => void;
	} = $props();

	function toggle(value: CardRarity) {
		selected = selected.includes(value)
			? selected.filter((rarity) => rarity !== value)
			: multiple
				? [...selected, value]
				: [value];
		onChange?.();
	}

	function initialsOf(option: RarityOption) {
		return option.initials ?? option.value.slice(0, 2);
	}
</script>

<!-- En mode compact la grille garde des pastilles de largeur égale, sur une ou deux lignes
     selon la largeur du conteneur (colonne latérale étroite vs modale). -->
<div class={compact ? 'grid grid-cols-3 gap-1.5 @xs:grid-cols-6' : 'flex flex-wrap gap-2'}>
	{#each options as option (option.value)}
		{@const active = selected.includes(option.value)}
		<button
			type="button"
			class="relative flex min-h-11 items-center gap-2 border text-[10px] font-bold tracking-wider uppercase transition-[background-color,border-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring"
			class:px-3={!compact}
			class:justify-center={compact}
			class:px-2={compact}
			class:text-foreground={active}
			class:text-muted-foreground={!active}
			class:scale-[1.02]={active}
			style={`--rarity-color:${option.color};border-color:${active ? option.color : `color-mix(in srgb, ${option.color} 35%, transparent)`};background:${active ? `color-mix(in srgb, ${option.color} 26%, #07111c)` : 'rgb(5 10 18 / 62%)'};box-shadow:${active ? `inset 0 0 20px color-mix(in srgb, ${option.color} 18%, transparent), 0 0 0 1px ${option.color}` : 'none'}`}
			aria-pressed={active}
			aria-label={compact ? option.value : undefined}
			title={compact ? option.value : undefined}
			onclick={() => toggle(option.value)}
		>
			{#if compact}
				<span class="grid place-items-center" style={`color:${option.color}`}>
					{initialsOf(option)}
				</span>
				{#if active}<CheckIcon class="size-3" />{/if}
			{:else}
				<span
					class="grid size-5 place-items-center border"
					style={`border-color:${option.color};color:${option.color}`}
				>
					{#if active}<CheckIcon class="size-3.5" />{:else}{initialsOf(option)}{/if}
				</span>
				<span>{option.value}</span>
			{/if}
		</button>
	{/each}
</div>

{#if name}
	{#each selected as rarity (rarity)}<input type="hidden" {name} value={rarity} />{/each}
{/if}
