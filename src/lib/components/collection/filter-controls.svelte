<script lang="ts">
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import TagFilterSelector from '$lib/components/collection/tag-filter-selector.svelte';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type {
		CardRarity,
		CardSearchSort,
		CardVariant,
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag
	} from '$lib/types';

	let {
		query = $bindable(''),
		sortBy = $bindable<CollectionSort | CardSearchSort>('acquiredDate'),
		selectedRarities = $bindable<CardRarity[]>([]),
		tagFilterIds = $bindable<string[]>([]),
		duplicate = $bindable<CollectionBooleanFilter>('all'),
		protected: protection = $bindable<CollectionBooleanFilter>('all'),
		variant = $bindable<CardVariant>('all'),
		tags,
		untaggedOption,
		allowTagCreation = true,
		canonical = false,
		onOpenTagEditor,
		onClear
	}: {
		query: string;
		sortBy: CollectionSort | CardSearchSort;
		selectedRarities: CardRarity[];
		tagFilterIds: string[];
		duplicate?: CollectionBooleanFilter;
		protected?: CollectionBooleanFilter;
		variant?: CardVariant;
		tags: CollectionTag[];
		untaggedOption?: string;
		allowTagCreation?: boolean;
		canonical?: boolean;
		onOpenTagEditor: () => void;
		onClear: () => void;
	} = $props();

	function setBooleanFilter(
		value: string | string[],
		setter: (value: CollectionBooleanFilter) => void
	) {
		if (value === 'all' || value === 'yes' || value === 'no') setter(value);
	}
</script>

<CardSearchPanel class="forge-panel" contentClass="p-4 sm:p-5">
	<Field.FieldGroup class="gap-5">
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
			<Field.Field>
				<Field.FieldLabel for="collection-search" class="forge-label">
					{$_('collection.search')}
				</Field.FieldLabel>
				<Input id="collection-search" bind:value={query} placeholder={$_('collection.search')} />
				{#if query.trim().length === 1 || query.trim().length === 2}
					<p class="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
						{$_('collection.search_minimum')}
					</p>
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.FieldLabel for="collection-sort" class="forge-label">
					{$_('collection.sort')}
				</Field.FieldLabel>
				<select
					id="collection-sort"
					bind:value={sortBy}
					aria-label={$_('collection.sort')}
					class="w-full"
				>
					{#if canonical}
						<option value="acquiredDate">{$_('collection.sortAcquiredDate')}</option>
						<option value="rarity">{$_('collection.sortRarity')}</option>
						<option value="name">{$_('collection.sortName')}</option>
					{:else}
						<option value="relevance">{$_('collection.sortRelevance')}</option>
						<option value="name">{$_('collection.sortName')}</option>
						<option value="rarity">{$_('collection.sortRarity')}</option>
					{/if}
				</select>
			</Field.Field>
		</div>

		<Field.FieldSet class="gap-2">
			<Field.FieldLegend class="forge-label">{$_('collection.rarities')}</Field.FieldLegend>
			<RaritySelector options={cardRarityOptions} bind:selected={selectedRarities} />
		</Field.FieldSet>
		{#if !canonical}<CardVariantSelector bind:value={variant} />{/if}

		{#if canonical}<div class="grid gap-4 lg:grid-cols-2">
				<Field.FieldSet class="gap-2">
					<Field.FieldLegend class="forge-label"
						>{$_('collection.duplicate_filter')}</Field.FieldLegend
					>
					<ToggleGroup.Root
						type="single"
						value={duplicate}
						onValueChange={(value) => setBooleanFilter(value, (next) => (duplicate = next))}
						variant="outline"
						spacing={1}
						class="grid grid-cols-3"
					>
						<ToggleGroup.Item value="all" class="min-h-11 px-2">{$_('common.all')}</ToggleGroup.Item
						>
						<ToggleGroup.Item value="yes" class="min-h-11 px-2"
							>{$_('collection.duplicates')}</ToggleGroup.Item
						>
						<ToggleGroup.Item value="no" class="min-h-11 px-2"
							>{$_('collection.unique_cards')}</ToggleGroup.Item
						>
					</ToggleGroup.Root>
				</Field.FieldSet>
				<Field.FieldSet class="gap-2">
					<Field.FieldLegend class="forge-label"
						>{$_('collection.protection_filter')}</Field.FieldLegend
					>
					<ToggleGroup.Root
						type="single"
						value={protection}
						onValueChange={(value) => setBooleanFilter(value, (next) => (protection = next))}
						variant="outline"
						spacing={1}
						class="grid grid-cols-3"
					>
						<ToggleGroup.Item value="all" class="min-h-11 px-2">{$_('common.all')}</ToggleGroup.Item
						>
						<ToggleGroup.Item value="yes" class="min-h-11 px-2"
							>{$_('collection.protected_cards')}</ToggleGroup.Item
						>
						<ToggleGroup.Item value="no" class="min-h-11 px-2"
							>{$_('collection.unprotected_cards')}</ToggleGroup.Item
						>
					</ToggleGroup.Root>
				</Field.FieldSet>
			</div>{/if}

		<Field.Field>
			<Field.FieldLabel class="forge-label">{$_('collection.tags')}</Field.FieldLabel>
			<TagFilterSelector
				bind:values={tagFilterIds}
				{tags}
				untaggedValue={untaggedOption}
				allowCreation={allowTagCreation}
				onCreate={onOpenTagEditor}
			/>
			<p class="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
				{$_('collection.tags_all_hint')}
			</p>
		</Field.Field>
	</Field.FieldGroup>

	{#if query || selectedRarities.length || tagFilterIds.length || (canonical ? sortBy !== 'acquiredDate' : sortBy !== 'rarity') || duplicate !== 'all' || protection !== 'all' || variant !== 'all'}
		<Button size="sm" variant="ghost" class="mt-4 w-fit" onclick={onClear}>
			{$_('collection.clearFilters')}
		</Button>
	{/if}
</CardSearchPanel>
