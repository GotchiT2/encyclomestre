<script lang="ts">
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import TagFilterSelector from '$lib/components/collection/tag-filter-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardVariant, CollectionTag } from '$lib/types';

	type SortBy = 'name' | 'rarity';
	let {
		query = $bindable(''),
		sortBy = $bindable<SortBy>('rarity'),
		selectedRarities = $bindable<CardRarity[]>([]),
		tagFilterIds = $bindable<string[]>([]),
		variant = $bindable<CardVariant>('all'),
		tags,
		untaggedOption,
		allowTagCreation = true,
		onOpenTagEditor,
		onClear
	}: {
		query: string;
		sortBy: SortBy;
		selectedRarities: CardRarity[];
		tagFilterIds: string[];
		variant?: CardVariant;
		tags: CollectionTag[];
		untaggedOption: string;
		allowTagCreation?: boolean;
		onOpenTagEditor: () => void;
		onClear: () => void;
	} = $props();
</script>

<CardSearchPanel class="forge-panel" contentClass="p-4 sm:p-5">
	<Field.FieldGroup class="gap-5">
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
			<Field.Field>
				<Field.FieldLabel for="collection-search" class="forge-label"
					>{$_('collection.search')}</Field.FieldLabel
				>
				<Input id="collection-search" bind:value={query} placeholder={$_('collection.search')} />
			</Field.Field>
			<Field.Field>
				<Field.FieldLabel for="collection-sort" class="forge-label"
					>{$_('collection.sort')}</Field.FieldLabel
				>
				<select
					id="collection-sort"
					bind:value={sortBy}
					aria-label={$_('collection.sort')}
					class="w-full"
				>
					<option value="name">{$_('collection.sortName')}</option>
					<option value="rarity">{$_('collection.sortRarity')}</option>
				</select>
			</Field.Field>
		</div>

		<Field.FieldSet class="gap-2">
			<Field.FieldLegend class="forge-label">{$_('collection.rarities')}</Field.FieldLegend>
			<RaritySelector options={cardRarityOptions} bind:selected={selectedRarities} />
		</Field.FieldSet>

		<CardVariantSelector bind:value={variant} />

		<Field.Field>
			<Field.FieldLabel class="forge-label">{$_('collection.tags')}</Field.FieldLabel>
			<TagFilterSelector
				bind:values={tagFilterIds}
				{tags}
				untaggedValue={untaggedOption}
				allowCreation={allowTagCreation}
				onCreate={onOpenTagEditor}
			/>
		</Field.Field>
	</Field.FieldGroup>

	{#if query || selectedRarities.length || tagFilterIds.length || sortBy !== 'rarity' || variant !== 'all'}
		<Button size="sm" variant="ghost" class="mt-4 w-fit" onclick={onClear}
			>{$_('collection.clearFilters')}</Button
		>
	{/if}
</CardSearchPanel>
