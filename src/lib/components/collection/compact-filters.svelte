<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { Snippet } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';
	import TagFilterSelector from './tag-filter-selector.svelte';
	import type {
		CollectionBooleanFilter,
		CardSearchSort,
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
		onClear,
		onOpenTagEditor,
		actions,
		canonical = true,
		untaggedOption = '-1'
	}: {
		query: string;
		sortBy: CollectionSort | CardSearchSort;
		variantIds: number[];
		tagFilterIds: string[];
		duplicate: CollectionBooleanFilter;
		protected: CollectionBooleanFilter;
		wishlistOwnerId: string;
		wishlistOwners?: User[];
		tags: CollectionTag[];
		onOpenTagEditor?: () => void;
		onClear: () => void;
		canonical?: boolean;
		untaggedOption?: string;
		actions?: Snippet;
	} = $props();
	const active = $derived(
		Boolean(
			query ||
			variantIds.length ||
			tagFilterIds.length ||
			duplicate !== 'all' ||
			protection !== 'all' ||
			wishlistOwnerId ||
			sortBy !== (canonical ? 'acquiredDate' : 'name')
		)
	);
</script>

<div class="compact-filters" data-testid="direct-filters">
	<div class="search-line">
		<Input
			id="compact-collection-search"
			bind:value={query}
			aria-label={$_('collection.search')}
			placeholder={$_('collection.search')}
			class="min-h-11 flex-1"
		/>{#if actions}{@render actions()}{/if}
	</div>
	{#if query.trim().length > 0 && query.trim().length < 3}<p
			class="text-xs text-muted-foreground"
			role="status"
		>
			{$_('collection.search_minimum')}
		</p>{/if}
	<div class="filter-line">
		{#if canonical}<label
				><span>{$_('collection.duplicate_filter')}</span><select
					bind:value={duplicate}
					aria-label={$_('collection.duplicate_filter')}
					>{#each ['all', 'yes', 'no'] as value (value)}<option {value}
							>{$_('plan.filters.' + value)}</option
						>{/each}</select
				></label
			>
			<label
				><span>{$_('collection.protection_filter')}</span><select
					bind:value={protection}
					aria-label={$_('collection.protection_filter')}
					>{#each ['all', 'yes', 'no'] as value (value)}<option {value}
							>{$_('plan.filters.' + value)}</option
						>{/each}</select
				></label
			>
		{/if}<VariantSelector bind:selected={variantIds} compact />
		<TagFilterSelector
			bind:values={tagFilterIds}
			{tags}
			untaggedValue={untaggedOption}
			allowCreation={Boolean(onOpenTagEditor)}
			onCreate={onOpenTagEditor}
		/>
		<label
			><span>{$_('collection.sort')}</span><select
				bind:value={sortBy}
				aria-label={$_('collection.sort')}
				>{#if canonical}<option value="acquiredDate">{$_('collection.sortAcquiredDate')}</option
					>{:else}<option value="relevance">{$_('collection.sortRelevance')}</option>{/if}<option
					value="name">{$_('collection.sortName')}</option
				></select
			></label
		>
		{#if wishlistOwners.length}<label
				><span>{$_('collection.wishlist_filter')}</span><select
					bind:value={wishlistOwnerId}
					aria-label={$_('collection.wishlist_filter')}
					><option value="">{$_('collection.wishlist_filter_all')}</option
					>{#each wishlistOwners as owner (owner.id)}<option value={owner.id}
							>{owner.displayName || owner.username}</option
						>{/each}</select
				></label
			>{/if}
		{#if active}<Button variant="ghost" onclick={onClear}>{$_('ux.clear')}</Button>{/if}
	</div>
</div>

<style>
	.compact-filters {
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	.search-line {
		display: flex;
		gap: 8px;
		min-width: 0;
	}
	.filter-line {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		overflow-x: auto;
		padding-block: 2px;
		scrollbar-width: thin;
	}
	.filter-line > :global(*) {
		flex: none;
	}
	label {
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		border: 1px solid var(--border);
		background: var(--card);
		padding-left: 10px;
		font-size: 13px;
	}
	label span {
		white-space: nowrap;
	}
	select {
		width: auto;
		max-width: 180px;
		border: 0;
		border-left: 1px solid var(--border);
	}
</style>
