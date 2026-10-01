<script lang="ts">
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';
	import TagFilterSelector from '$lib/components/collection/tag-filter-selector.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type {
		CardSearchSort,
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag,
		User
	} from '$lib/types';

	let {
		query = $bindable(''),
		sortBy = $bindable<CollectionSort | CardSearchSort>('acquiredDate'),
		variantIds = $bindable<number[]>([]),
		tagFilterIds = $bindable<string[]>([]),
		duplicate = $bindable<CollectionBooleanFilter>('all'),
		protected: protection = $bindable<CollectionBooleanFilter>('all'),
		wishlistOwnerId = $bindable(''),
		wishlistOwners = [],
		tags,
		untaggedOption,
		allowTagCreation = true,
		canonical = false,
		onOpenTagEditor,
		onClear
	}: {
		query: string;
		sortBy: CollectionSort | CardSearchSort;
		variantIds: number[];
		tagFilterIds: string[];
		duplicate?: CollectionBooleanFilter;
		protected?: CollectionBooleanFilter;
		wishlistOwnerId?: string;
		wishlistOwners?: User[];
		tags: CollectionTag[];
		untaggedOption?: string;
		allowTagCreation?: boolean;
		canonical?: boolean;
		onOpenTagEditor: () => void;
		onClear: () => void;
	} = $props();

	const hasActiveFilters = $derived(
		Boolean(query) ||
			variantIds.length > 0 ||
			tagFilterIds.length > 0 ||
			(canonical ? sortBy !== 'acquiredDate' : sortBy !== 'name') ||
			duplicate !== 'all' ||
			protection !== 'all' ||
			Boolean(wishlistOwnerId)
	);
</script>

{#snippet booleanSwitch(
	label: string,
	switchLabel: string,
	value: CollectionBooleanFilter,
	setValue: (next: CollectionBooleanFilter) => void
)}
	<div
		class="flex min-h-11 items-center justify-between gap-3 border border-primary/20 bg-background/40 px-3"
	>
		<span class="forge-label">{label}</span>
		<select
			aria-label={switchLabel}
			{value}
			onchange={(event) => setValue(event.currentTarget.value as CollectionBooleanFilter)}
			class="min-h-11"
			><option value="all">{$_('plan.filters.all')}</option><option value="yes"
				>{$_('plan.filters.yes')}</option
			><option value="no">{$_('plan.filters.no')}</option></select
		>
	</div>
{/snippet}

<Field.FieldGroup class="gap-5">
	<div class="grid gap-3 @lg:grid-cols-[minmax(0,1fr)_12rem]">
		<Field.Field>
			<Field.FieldLabel for="collection-search" class="forge-label">
				{$_('collection.search')}
			</Field.FieldLabel>
			<Input id="collection-search" bind:value={query} placeholder={$_('collection.search')} />
			{#if query.trim().length === 1 || query.trim().length === 2}
				<p class="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
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
					<option value="name">{$_('collection.sortName')}</option>
				{:else}
					<option value="relevance">{$_('collection.sortRelevance')}</option>
					<option value="name">{$_('collection.sortName')}</option>
				{/if}
			</select>
		</Field.Field>
	</div>

	<Field.FieldSet class="gap-2">
		<Field.FieldLegend class="forge-label">{$_('collection.variants')}</Field.FieldLegend>
		<VariantSelector bind:selected={variantIds} compact />
	</Field.FieldSet>

	{#if canonical}
		<div class="grid gap-2 @md:grid-cols-2">
			{@render booleanSwitch(
				$_('collection.duplicate_filter'),
				$_('collection.only_duplicates'),
				duplicate,
				(next) => (duplicate = next)
			)}
			{@render booleanSwitch(
				$_('collection.protection_filter'),
				$_('collection.only_protected'),
				protection,
				(next) => (protection = next)
			)}
		</div>
	{/if}

	{#if canonical && wishlistOwners.length}
		<Field.Field>
			<Field.FieldLabel for="collection-wishlist-owner" class="forge-label">
				{$_('collection.wishlist_filter')}
			</Field.FieldLabel>
			<select id="collection-wishlist-owner" bind:value={wishlistOwnerId} class="w-full">
				<option value="">{$_('collection.wishlist_filter_all')}</option>
				{#each wishlistOwners as owner (owner.id)}
					<option value={owner.id}>{owner.displayName || owner.username}</option>
				{/each}
			</select>
		</Field.Field>
	{/if}

	<Field.Field>
		<Field.FieldLabel class="forge-label">{$_('collection.tags')}</Field.FieldLabel>
		<TagFilterSelector
			bind:values={tagFilterIds}
			{tags}
			untaggedValue={untaggedOption}
			allowCreation={allowTagCreation}
			onCreate={onOpenTagEditor}
		/>
		<p class="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
			{$_('collection.tags_all_hint')}
		</p>
	</Field.Field>
</Field.FieldGroup>

{#if hasActiveFilters}
	<Button size="sm" variant="ghost" class="mt-4 w-fit" onclick={onClear}>
		{$_('collection.clearFilters')}
	</Button>
{/if}
