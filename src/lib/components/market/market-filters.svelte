<script lang="ts">
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';
	import type { MarketSort } from '$lib/domain/market/auction-display';
	import type { CardRarity, CardVariant } from '$lib/types';

	let {
		query = $bindable(''),
		variant = $bindable<CardVariant>('all'),
		rarities = $bindable<CardRarity[]>([]),
		sort = $bindable<MarketSort>('ending'),
		onSearch,
		onFilterChange
	}: {
		query: string;
		variant: CardVariant;
		rarities: CardRarity[];
		sort: MarketSort;
		onSearch: () => void;
		onFilterChange: () => void;
	} = $props();
</script>

<Field.FieldGroup class="gap-5">
	<Field.Field>
		<Field.FieldLabel for="market-search" class="forge-label">
			{$_('market.search')}
		</Field.FieldLabel>
		<Input
			id="market-search"
			bind:value={query}
			placeholder={$_('market.search')}
			oninput={onSearch}
		/>
	</Field.Field>

	<CardVariantSelector bind:value={variant} onChange={onFilterChange} />

	<Field.FieldSet class="gap-2">
		<Field.FieldLegend class="forge-label">{$_('codex.rarities')}</Field.FieldLegend>
		<RaritySelector
			options={cardRarityOptions}
			bind:selected={rarities}
			compact
			onChange={onFilterChange}
		/>
	</Field.FieldSet>

	<Field.Field>
		<Field.FieldLabel for="market-sort" class="forge-label">{$_('market.sort')}</Field.FieldLabel>
		<select id="market-sort" bind:value={sort} onchange={onFilterChange} class="w-full">
			{#each ['ending', 'bid_desc', 'bid_asc'] as option (option)}
				<option value={option}>{$_(`market.sort_${option}`)}</option>
			{/each}
		</select>
	</Field.Field>
</Field.FieldGroup>
