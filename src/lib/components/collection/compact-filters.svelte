<script lang="ts">
	import { _ } from '$lib/i18n';
	import { onMount } from 'svelte';
	import { getVariants } from '$lib/api/variants';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';
	import TagFilterSelector from './tag-filter-selector.svelte';
	import FilterControls from './filter-controls.svelte';
	import type {
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag,
		User,
		VariantDefinition
	} from '$lib/types';
	let {
		query = $bindable(''),
		sortBy = $bindable<CollectionSort>('acquiredDate'),
		variantIds = $bindable<number[]>([]),
		tagFilterIds = $bindable<string[]>([]),
		duplicate = $bindable<CollectionBooleanFilter>('all'),
		protected: protection = $bindable<CollectionBooleanFilter>('all'),
		wishlistOwnerId = $bindable(''),
		wishlistOwners = [],
		tags,
		onOpenTagEditor,
		onClear
	}: {
		query: string;
		sortBy: CollectionSort;
		variantIds: number[];
		tagFilterIds: string[];
		duplicate: CollectionBooleanFilter;
		protected: CollectionBooleanFilter;
		wishlistOwnerId: string;
		wishlistOwners?: User[];
		tags: CollectionTag[];
		onOpenTagEditor: () => void;
		onClear: () => void;
	} = $props();
	let variants = $state<VariantDefinition[]>([]);
	onMount(() => {
		void getVariants()
			.then((value) => (variants = value))
			.catch(() => undefined);
	});
	let panel = $state<'protection' | 'variants' | 'tags' | 'all' | null>(null);
	const active = $derived(
		variantIds.length +
			tagFilterIds.length +
			Number(duplicate !== 'all') +
			Number(protection !== 'all') +
			Number(Boolean(wishlistOwnerId)) +
			Number(sortBy !== 'acquiredDate')
	);
</script>

<div class="compact-filters">
	<Input
		id="compact-collection-search"
		bind:value={query}
		aria-label={$_('collection.search')}
		placeholder={$_('collection.search')}
		class="min-h-11"
	/>
	{#if query.trim().length > 0 && query.trim().length < 3}<p
			class="text-xs text-muted-foreground"
			role="status"
		>
			{$_('collection.search_minimum')}
		</p>{/if}
	<div class="filter-line">
		<div class="filter-shortcuts">
			<Button
				variant={duplicate !== 'all' ? 'default' : 'outline'}
				aria-pressed={duplicate === 'yes'}
				onclick={() => (duplicate = duplicate === 'yes' ? 'all' : 'yes')}
				>{$_('collection.duplicate_filter')}{#if duplicate === 'no'}
					· {$_('plan.filters.no')}{/if}</Button
			>
			<Button
				variant={protection !== 'all' ? 'default' : 'outline'}
				onclick={() => (panel = 'protection')}
				>{$_('collection.protection_filter')}{#if protection !== 'all'}
					· {$_('plan.filters.' + protection)}{/if}</Button
			>
			<Button
				variant={variantIds.length ? 'default' : 'outline'}
				onclick={() => (panel = 'variants')}
				>{variantIds.length === 1
					? (variants.find((item) => item.id === variantIds[0])?.name ?? $_('collection.variants'))
					: $_('collection.variants')}{#if variantIds.length > 1}
					· {variantIds.length}{/if}</Button
			>
			<Button variant={tagFilterIds.length ? 'default' : 'outline'} onclick={() => (panel = 'tags')}
				>{tagFilterIds.length
					? (tags.find((tag) => tag.id === tagFilterIds[0])?.name ?? $_('collection.untagged'))
					: $_('collection.tags')}{#if tagFilterIds.length > 1}
					+{tagFilterIds.length - 1}{/if}</Button
			>
		</div>
		<Button variant="outline" class="shrink-0" onclick={() => (panel = 'all')}
			>{$_('arcade.filters')}{#if active}
				· {active}{/if}</Button
		>
	</div>
	{#if active}<div class="flex flex-wrap gap-1" aria-label={$_('collection.filtersDescription')}>
			{#if duplicate !== 'all'}<Button variant="ghost" onclick={() => (duplicate = 'all')}
					>{$_('collection.duplicate_filter')} · {$_('plan.filters.' + duplicate)} ×</Button
				>{/if}
			{#if protection !== 'all'}<Button variant="ghost" onclick={() => (protection = 'all')}
					>{$_('collection.protection_filter')} · {$_('plan.filters.' + protection)} ×</Button
				>{/if}
			{#if variantIds.length}<Button variant="ghost" onclick={() => (variantIds = [])}
					>{$_('collection.variants')} · {variantIds.length} ×</Button
				>{/if}
			{#each tagFilterIds as id (id)}<Button
					variant="ghost"
					onclick={() => (tagFilterIds = tagFilterIds.filter((value) => value !== id))}
					>{tags.find((tag) => tag.id === id)?.name ?? $_('collection.tags')} ×</Button
				>{/each}
		</div>{/if}
</div>
<Dialog.Root
	open={panel !== null}
	onOpenChange={(value) => {
		if (!value) panel = null;
	}}
>
	<Dialog.Content class="arcade-sheet max-w-xl overflow-y-auto p-5">
		<Dialog.Header
			><Dialog.Title
				>{$_(
					panel === 'variants'
						? 'collection.variants'
						: panel === 'tags'
							? 'collection.tags'
							: panel === 'protection'
								? 'collection.protection_filter'
								: 'arcade.filters'
				)}</Dialog.Title
			><Dialog.Description>{$_('collection.filtersDescription')}</Dialog.Description></Dialog.Header
		>
		{#if panel === 'variants'}<VariantSelector inline bind:selected={variantIds} />
		{:else if panel === 'tags'}<TagFilterSelector
				inline
				bind:values={tagFilterIds}
				{tags}
				untaggedValue="-1"
				onCreate={onOpenTagEditor}
			/>
		{:else if panel === 'protection'}<div class="flex flex-wrap gap-2">
				{#each ['all', 'yes', 'no'] as value (value)}<Button
						variant={protection === value ? 'default' : 'outline'}
						onclick={() => (protection = value as CollectionBooleanFilter)}
						>{$_('plan.filters.' + value)}</Button
					>{/each}
			</div>
		{:else}<FilterControls
				bind:query
				bind:sortBy
				bind:variantIds
				bind:tagFilterIds
				bind:duplicate
				bind:protected={protection}
				bind:wishlistOwnerId
				{wishlistOwners}
				{tags}
				untaggedOption="-1"
				canonical
				{onOpenTagEditor}
				{onClear}
			/>{/if}
		<Button onclick={() => (panel = null)}>{$_('arcade.closeFilters')}</Button>
	</Dialog.Content>
</Dialog.Root>

<style>
	.compact-filters {
		display: grid;
		gap: 0.6rem;
		min-width: 0;
	}
	.filter-line {
		display: flex;
		gap: 0.5rem;
		min-width: 0;
	}
	.filter-shortcuts {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		flex: 1;
		min-width: 0;
		scrollbar-width: thin;
	}
	.filter-shortcuts :global(button) {
		flex: none;
		min-height: 44px;
	}
	.filter-shortcuts :global(button):focus-visible {
		outline-offset: -3px;
	}
</style>
