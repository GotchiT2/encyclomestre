<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type {
		CardRecord,
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag
	} from '$lib/types';
	import type { CollectionQuery } from '$lib/api';

	let {
		open = $bindable(false),
		cards,
		tags = [],
		title,
		onSelect,
		hasMore = false,
		loadingMore = false,
		onLoadMore,
		onFiltersChange
	}: {
		open?: boolean;
		cards: CardRecord[];
		tags?: CollectionTag[];
		title: string;
		onSelect: (card: CardRecord) => void;
		hasMore?: boolean;
		loadingMore?: boolean;
		onLoadMore?: () => void;
		onFiltersChange?: (filters: CollectionQuery) => void;
	} = $props();

	let query = $state('');
	let variantIds = $state<number[]>([]);
	let tagIds = $state<string[]>([]);
	let sortBy = $state<CollectionSort>('acquiredDate');
	let duplicate = $state<CollectionBooleanFilter>('all');
	let protection = $state<CollectionBooleanFilter>('all');
	let filterTimer: number | undefined;
	let lastFilterKey = '';
	const filters = $derived<CollectionQuery>({
		query,
		sortBy,
		variantIds,
		tagIds,
		duplicate,
		protected: protection
	});
	const filterKey = $derived(JSON.stringify(filters));
	const filteredCards = $derived(
		cards
			.filter((card) => {
				const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
				const cardTags = (card.collectionTags ?? []).map((tag) => tag.id);
				return (
					(!normalizedQuery ||
						card.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
						card.shortDescription.toLocaleLowerCase('fr-FR').includes(normalizedQuery)) &&
					(!variantIds.length || variantIds.includes(card.variantId)) &&
					(duplicate === 'all' || Boolean(card.duplicate) === (duplicate === 'yes')) &&
					(protection === 'all' || Boolean(card.userProtected) === (protection === 'yes')) &&
					(!tagIds.length || tagIds.every((tagId) => cardTags.includes(tagId)))
				);
			})
			.toSorted((left, right) => {
				if (sortBy === 'name') return left.title.localeCompare(right.title, 'fr');
				return (right.acquiredAt ?? '').localeCompare(left.acquiredAt ?? '');
			})
	);

	function choose(card: CardRecord) {
		onSelect(card);
		open = false;
	}

	$effect(() => {
		if (!open || !onFiltersChange || filterKey === lastFilterKey) return;
		window.clearTimeout(filterTimer);
		filterTimer = window.setTimeout(() => {
			lastFilterKey = filterKey;
			onFiltersChange(filters);
		}, 450);
		return () => window.clearTimeout(filterTimer);
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="h-[min(90dvh,58rem)] max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-0">
		<div class="flex min-h-12 items-center gap-3 border-b border-primary/20 px-4 py-2 pr-14">
			<p class="shrink-0 font-mono text-[9px] uppercase tracking-widest text-primary">
				{$_('profile.select_cards')}
			</p>
			<span class="h-4 w-px bg-primary/25" aria-hidden="true"></span>
			<Dialog.Title class="truncate text-lg leading-tight sm:text-xl">{title}</Dialog.Title>
		</div>
		<div class="min-h-0 overflow-y-auto p-4">
			<div class="forge-panel-flat mb-4 p-4">
				<FilterControls
					bind:query
					bind:sortBy
					bind:variantIds
					bind:tagFilterIds={tagIds}
					bind:duplicate
					bind:protected={protection}
					{tags}
					canonical
					allowTagCreation={false}
					onOpenTagEditor={() => {}}
					onClear={() => {
						query = '';
						variantIds = [];
						tagIds = [];
						duplicate = 'all';
						protection = 'all';
						sortBy = 'acquiredDate';
					}}
				/>
			</div>
			<div class="wikiforge-card-grid">
				{#each filteredCards as card (card.id)}
					<div class="wikiforge-card-size relative">
						<CardTile {card} showFriendOwners={false} onOpen={() => choose(card)} />
					</div>
				{/each}
			</div>
			{#if hasMore}<div class="mt-5 flex justify-center">
					<Button variant="outline" disabled={loadingMore} onclick={onLoadMore}
						>{loadingMore ? $_('common.loading') : $_('common.load_more')}</Button
					>
				</div>{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
