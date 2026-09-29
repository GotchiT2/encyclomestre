<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import XIcon from '@lucide/svelte/icons/x';
	import { onDestroy, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type {
		CardRecord,
		CardSearchSort,
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

	// Le composant est monté deux fois dans l'éditeur d'échange : les identifiants
	// de champ doivent rester distincts pour que les libellés restent associés.
	const uid = $props.id();

	let query = $state('');
	let variantIds = $state<number[]>([]);
	let sortBy = $state<CardSearchSort>('name');
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
		variantIds = [];
		sortBy = 'name';
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
				variantIds,
				sortBy,
				page: nextPage - 1,
				pageSize,
				cursor: query.trim() ? undefined : cursorByPage.get(nextPage)
			});
			if (requestId !== requestVersion) return;
			const catalogueIds = response.items.map((card) => card.catalogueId ?? card.id);
			try {
				comparisonCounts = loadComparisonCounts ? await loadComparisonCounts(catalogueIds) : {};
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
					style={`color:${card.variant.color};border-color:${card.variant.color}`}
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

	<div class="@container forge-panel-flat mt-2 p-3">
		<p class="forge-label mb-2">{$_('cards.searchPanel')}</p>
		<Field.FieldGroup class="gap-3">
			<div class="grid gap-2 @md:grid-cols-2">
				<Field.Field>
					<Field.FieldLabel for={`${uid}-search`} class="forge-label">
						{$_('collection.search')}
					</Field.FieldLabel>
					<Input
						id={`${uid}-search`}
						bind:value={query}
						oninput={changeTextQuery}
						placeholder={$_('collection.search')}
					/>
				</Field.Field>
				<Field.Field>
					<Field.FieldLabel for={`${uid}-sort`} class="forge-label">
						{$_('filters.sortBy')}
					</Field.FieldLabel>
					<select id={`${uid}-sort`} bind:value={sortBy} onchange={changeFilters} class="w-full">
						<option value="relevance">{$_('collection.sortRelevance')}</option>
						<option value="name">{$_('collection.sortName')}</option>
					</select>
				</Field.Field>
			</div>

			<Field.FieldSet class="gap-2">
				<Field.FieldLegend class="forge-label">{$_('collection.variants')}</Field.FieldLegend>
				<VariantSelector bind:selected={variantIds} compact onChange={changeFilters} />
			</Field.FieldSet>
		</Field.FieldGroup>
	</div>

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
		<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
			{#each resultCards.filter((card) => !selectedIds.includes(card.id) && !card.userProtected && !card.pendingTradeId && !card.activeAuctionId) as card (card.id)}
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
