<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import XIcon from '@lucide/svelte/icons/x';
	import { onDestroy, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type {
		CardRarity,
		CardRecord,
		CardSearchSort,
		CardVariant,
		PaginatedResponse,
		TradeCardSearchQuery
	} from '$lib/types';

	let {
		title,
		showTitle = true,
		scopeKey,
		active = false,
		comparisonOwnerName,
		comparisonOwnerIsViewer = false,
		initialCards = [],
		loadCards,
		loadComparisonCounts,
		selectedIds = $bindable<string[]>([])
	}: {
		title: string;
		showTitle?: boolean;
		scopeKey: string;
		active?: boolean;
		comparisonOwnerName?: string;
		comparisonOwnerIsViewer?: boolean;
		initialCards?: CardRecord[];
		loadCards: (query: TradeCardSearchQuery) => Promise<PaginatedResponse<CardRecord>>;
		loadComparisonCounts?: (variantIds: string[]) => Promise<Record<string, number>>;
		selectedIds?: string[];
	} = $props();

	let query = $state('');
	let rarities = $state<CardRarity[]>([]);
	let sortBy = $state<CardSearchSort>('rarity');
	let variant = $state<CardVariant>('all');
	let page = $state(1);
	let total = $state(0);
	let resultCards = $state<CardRecord[]>([]);
	let knownCards = $state<CardRecord[]>([]);
	let comparisonCounts = $state<Record<string, number>>({});
	let hasLoaded = $state(false);
	let loading = $state(false);
	let failed = $state(false);
	let activeScope = $state('');
	let initiallyLoadedScope = $state('');
	let hasMore = $state(false);
	let debounceTimer: number | undefined;
	let requestVersion = 0;
	const cursorByPage = new SvelteMap<number, string | undefined>([[1, undefined]]);
	const pageSize = 12;
	const selectedCards = $derived(
		selectedIds
			.map((id) => knownCards.find((card) => card.id === id))
			.filter(Boolean) as CardRecord[]
	);

	$effect(() => {
		if (activeScope === scopeKey) {
			knownCards = mergeCards(
				untrack(() => knownCards),
				initialCards
			);
			return;
		}
		activeScope = scopeKey;
		query = '';
		rarities = [];
		sortBy = 'rarity';
		variant = 'all';
		page = 1;
		total = 0;
		resultCards = [];
		knownCards = [...initialCards];
		comparisonCounts = {};
		hasLoaded = false;
		failed = false;
		hasMore = false;
		cursorByPage.clear();
		cursorByPage.set(1, undefined);
	});

	$effect(() => {
		if (!active || activeScope !== scopeKey || initiallyLoadedScope === scopeKey) return;
		initiallyLoadedScope = scopeKey;
		void search();
	});

	function mergeCards(current: CardRecord[], incoming: CardRecord[]) {
		return [...new Map([...current, ...incoming].map((card) => [card.id, card])).values()];
	}

	function resetResults() {
		requestVersion += 1;
		// A stale request is ignored through requestVersion. Release the local loading
		// lock as well so a new debounced query is never lost while it is in flight.
		loading = false;
		page = 0;
		resultCards = [];
		hasLoaded = false;
		failed = false;
		hasMore = false;
		cursorByPage.clear();
		cursorByPage.set(1, undefined);
	}

	function changeTextQuery() {
		if (query.trim()) sortBy = 'relevance';
		resetResults();
		window.clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => void search(), 400);
	}

	function changeFilters() {
		resetResults();
		void search();
	}

	async function search(loadMore = false) {
		if (loading) return;
		const nextPage = loadMore ? page + 1 : 1;
		const requestId = requestVersion + 1;
		requestVersion = requestId;
		loading = true;
		failed = false;
		try {
			const response = await loadCards({
				query,
				rarities,
				variant,
				sortBy,
				page: nextPage - 1,
				pageSize,
				cursor: query.trim() ? undefined : cursorByPage.get(nextPage)
			});
			if (requestId !== requestVersion) return;
			const variantIds = response.items.map((card) => card.catalogueId ?? card.id);
			try {
				comparisonCounts = loadComparisonCounts ? await loadComparisonCounts(variantIds) : {};
			} catch {
				comparisonCounts = {};
			}
			page = response.meta.page;
			total = response.meta.total;
			if (response.meta.nextCursor) {
				cursorByPage.set(response.meta.page + 1, response.meta.nextCursor);
			}
			resultCards = loadMore ? mergeCards(resultCards, response.items) : response.items;
			knownCards = mergeCards(knownCards, response.items);
			hasMore = query.trim()
				? response.meta.page < response.meta.totalPages
				: Boolean(response.meta.nextCursor);
			hasLoaded = true;
		} catch {
			if (requestId !== requestVersion) return;
			failed = true;
			if (!loadMore) resultCards = [];
			hasLoaded = true;
		} finally {
			if (requestId === requestVersion) loading = false;
		}
	}

	onDestroy(() => {
		if (typeof window !== 'undefined') window.clearTimeout(debounceTimer);
	});

	function comparisonOwnership(card: CardRecord) {
		const count = comparisonCounts[card.catalogueId ?? card.id] ?? 0;
		if (!count) return undefined;
		return {
			count,
			label: comparisonOwnerIsViewer
				? $_('cardState.owned_by_viewer', { values: { count } })
				: $_('cardState.owned_by', {
						values: { user: comparisonOwnerName ?? '', count }
					})
		};
	}
</script>

<section class="min-w-0 bg-background/40 p-2 sm:p-3">
	{#if showTitle}<h2 class="text-lg font-black uppercase tracking-tight sm:text-xl">
			{title}
		</h2>{/if}
	<div class={`${showTitle ? 'mt-2' : ''} border border-primary/20 bg-card p-2`}>
		<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
			{$_('trades.counterparties')}
		</p>
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each selectedCards as card (card.id)}
				<Button
					size="xs"
					variant="outline"
					class="h-auto max-w-full whitespace-normal break-words text-left"
					style={`color:${card.rarityColor};border-color:${card.rarityColor}`}
					onclick={() => (selectedIds = selectedIds.filter((id) => id !== card.id))}
				>
					{card.title}<XIcon data-icon="inline-end" />
				</Button>
			{/each}
			{#if !selectedCards.length}
				<span class="text-sm italic text-muted-foreground">
					{$_('trades.no_counterparty')}
				</span>
			{/if}
		</div>
	</div>

	<CardSearchPanel class="mt-2">
		<div class="grid gap-2">
			<div class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(14rem,1fr)_auto] lg:items-end">
				<Input
					bind:value={query}
					oninput={changeTextQuery}
					placeholder={$_('collection.search')}
					class="h-9 w-full text-sm"
				/>
				<select
					bind:value={sortBy}
					onchange={changeFilters}
					aria-label={$_('collection.sort')}
					class="h-9 w-full self-end border border-primary/50 bg-card px-2 py-0 font-mono text-[10px] leading-9 uppercase tracking-wider text-primary outline-none focus:border-primary lg:w-40"
				>
					<option value="relevance">{$_('collection.sortRelevance')}</option>
					<option value="rarity">{$_('collection.sortRarity')}</option>
					<option value="name">{$_('collection.sortName')}</option>
				</select>
			</div>
			<RaritySelector
				options={cardRarityOptions}
				bind:selected={rarities}
				onChange={changeFilters}
			/>
			<CardVariantSelector bind:value={variant} onChange={changeFilters} />
		</div>
	</CardSearchPanel>

	{#if !hasLoaded && !loading}
		<p
			class="mt-3 border border-dashed border-primary/25 p-5 text-center italic text-muted-foreground"
		>
			{$_('trades.filter_cards_prompt')}
		</p>
	{:else if failed}
		<p class="mt-3 border border-destructive/40 bg-destructive/10 p-4 text-destructive">
			{$_('trades.cards_load_error')}
		</p>
	{:else if loading}
		<p class="mt-3 p-5 text-center font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('trades.loading_cards')}
		</p>
	{:else if !resultCards.length}
		<p
			class="mt-3 border border-dashed border-primary/25 p-5 text-center italic text-muted-foreground"
		>
			{$_('trades.no_filtered_cards')}
		</p>
	{:else}
		<p class="mt-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('trades.filtered_card_count', { values: { count: total } })}
		</p>
		<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each resultCards.filter((card) => !selectedIds.includes(card.id)) as card (card.id)}
				<div class="relative min-w-0">
					<CardTile
						{card}
						tags={card.collectionTags ?? []}
						showFriendOwners={false}
						comparisonOwnership={comparisonOwnership(card)}
						onOpen={() => (selectedIds = [...selectedIds, card.id])}
					/>
				</div>
			{/each}
		</div>
		{#if hasMore}
			<div class="mt-4 flex justify-center">
				<Button size="sm" variant="outline" disabled={loading} onclick={() => void search(true)}>
					{loading ? $_('trades.loading_cards') : $_('common.load_more')}
				</Button>
			</div>
		{/if}
	{/if}
</section>
