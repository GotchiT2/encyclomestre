<script lang="ts">
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { MarketSort } from '$lib/domain/market/auction-display';

	let {
		query = $bindable(''),
		variantIds = $bindable<number[]>([]),
		sort = $bindable<MarketSort>('ending'),
		onSearch,
		onFilterChange
	}: {
		query: string;
		variantIds: number[];
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

	<VariantSelector bind:selected={variantIds} compact onChange={onFilterChange} />

	<Field.Field>
		<Field.FieldLabel for="market-sort" class="forge-label">{$_('market.sort')}</Field.FieldLabel>
		<select id="market-sort" bind:value={sort} onchange={onFilterChange} class="w-full">
			{#each ['ending', 'bid_desc', 'bid_asc'] as option (option)}
				<option value={option}>{$_(`market.sort_${option}`)}</option>
			{/each}
		</select>
	</Field.Field>
</Field.FieldGroup>
