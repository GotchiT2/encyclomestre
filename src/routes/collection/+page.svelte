<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import CollectionResultSummary from '$lib/components/collection/collection-result-summary.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import FilterShell from '$lib/components/layout/filter-shell.svelte';
	import SelectionPanel from '$lib/components/collection/selection-panel.svelte';
	import TagEditor from '$lib/components/collection/tag-editor.svelte';
	import {
		buildCollectionFilterTarget,
		effectiveCollectionQuery
	} from '$lib/components/collection/collection-filter-url';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		addWishlistRegistryCard,
		applyWikiForgeTag,
		getWikiForgeCollectionPage,
		getFriends,
		getWishlists,
		nextCollectionPosition,
		protectWikiForgeCard,
		unprotectWikiForgeCard
	} from '$lib/api';
	import { cardRarityCodeByName } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';
	import type {
		ActiveSaleSummary,
		CardRarity,
		CardRecord,
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag,
		CollectionTagAssignments,
		User,
		WishlistRegistrySummary
	} from '$lib/types';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let query = $state('');
	let sortBy = $state<CollectionSort>('acquiredDate');
	let selectedRarities = $state<CardRarity[]>([]);
	let tagFilterIds = $state<string[]>([]);
	let duplicate = $state<CollectionBooleanFilter>('all');
	let protection = $state<CollectionBooleanFilter>('all');
	let wishlistOwnerId = $state('');
	let wishlistOwners = $state<User[]>([]);
	let cards = $state<CardRecord[]>([]);
	let tags = $state<CollectionTag[]>([]);
	let assignments = $state<CollectionTagAssignments>({});
	let total = $state(-1);
	let responsePage = $state(0);
	let nextCursor = $state<string | null>(null);
	let hasNext = $state(false);
	let rarityResults = $state<Partial<Record<CardRecord['rarityInitials'], number>>>({});
	let loading = $state(true);
	let loadingMore = $state(false);
	let failed = $state(false);
	let loadMoreFailed = $state(false);
	let ready = $state(false);
	let isSelectionMode = $state(false);
	let selectedCardIds = $state<string[]>([]);
	let bulkTagIds = $state<string[]>([]);
	let isTagEditorOpen = $state(false);
	let selectedCard = $state<CardRecord | null>(null);
	let wishlists = $state<WishlistRegistrySummary[]>([]);
	let filterTimer: number | undefined;
	let previousFilterKey = '';
	let requestId = 0;
	let requestController: AbortController | null = null;
	const activeFilterCount = $derived(
		(query ? 1 : 0) +
			selectedRarities.length +
			tagFilterIds.length +
			(sortBy !== 'acquiredDate' ? 1 : 0) +
			(duplicate !== 'all' ? 1 : 0) +
			(protection !== 'all' ? 1 : 0) +
			(wishlistOwnerId ? 1 : 0)
	);
	const selectedUnprotectedCount = $derived(
		cards.filter((card) => selectedCardIds.includes(card.id) && !card.userProtected).length
	);

	const filterKey = $derived(
		JSON.stringify([
			effectiveCollectionQuery(query) ?? '',
			sortBy,
			selectedRarities,
			tagFilterIds,
			duplicate,
			protection,
			wishlistOwnerId
		])
	);

	function requestQuery(position?: { page: number; cursor: string | null }) {
		return {
			query: effectiveCollectionQuery(query),
			sortBy,
			rarities: selectedRarities.map((rarity) => cardRarityCodeByName[rarity]),
			tagIds: tagFilterIds,
			duplicate,
			protected: protection,
			wishlistOwnerId,
			page: position?.page,
			cursor: position?.cursor ?? undefined
		};
	}

	function mergeCards(current: CardRecord[], incoming: CardRecord[]) {
		return [...new Map([...current, ...incoming].map((card) => [card.id, card])).values()];
	}

	function registerCards(incoming: CardRecord[]) {
		assignments = {
			...assignments,
			...Object.fromEntries(incoming.map((card) => [card.id, card.collectionTagIds ?? []]))
		};
	}

	function applyResponse(
		response: Awaited<ReturnType<typeof getWikiForgeCollectionPage>>,
		append: boolean
	) {
		cards = append ? mergeCards(cards, response.items) : response.items;
		registerCards(response.items);
		total = response.total;
		responsePage = response.page;
		nextCursor = response.nextCursor;
		hasNext = response.hasNext;
		if (response.rarityResults !== null) rarityResults = response.rarityResults;
	}

	onMount(async () => {
		query = data.filters.query;
		sortBy = data.filters.sortBy;
		selectedRarities = data.filters.selectedRarities;
		tagFilterIds = data.filters.tagFilterIds;
		duplicate = data.filters.duplicate;
		protection = data.filters.protection;
		wishlistOwnerId = data.filters.wishlistOwnerId;
		const dependencies = Promise.allSettled([data.tags, getWishlists()]);
		try {
			const collection = await data.collection;
			applyResponse(collection, false);
		} catch {
			failed = true;
		} finally {
			loading = false;
			previousFilterKey = filterKey;
			ready = true;
		}
		const [tagsResult, wishlistsResult] = await dependencies;
		if (tagsResult.status === 'fulfilled') tags = tagsResult.value;
		if (wishlistsResult.status === 'fulfilled') wishlists = wishlistsResult.value;
		const sessionUser = $currentSession?.user;
		const friendships = await getFriends().catch(() => []);
		wishlistOwners = [
			...(sessionUser ? [sessionUser] : []),
			...friendships
				.filter((friendship) => friendship.status === 'accepted')
				.map((friendship) => friendship.user)
		];
	});

	$effect(() => {
		const currentKey = filterKey;
		if (!ready || currentKey === previousFilterKey) return;
		window.clearTimeout(filterTimer);
		filterTimer = window.setTimeout(async () => {
			previousFilterKey = currentKey;
			requestController?.abort();
			const controller = new AbortController();
			requestController = controller;
			const currentRequest = ++requestId;
			loading = true;
			failed = false;
			loadMoreFailed = false;
			selectedCardIds = [];
			try {
				replaceState(
					resolve(
						buildCollectionFilterTarget({
							query,
							sortBy,
							selectedRarities,
							tagFilterIds,
							duplicate,
							protected: protection,
							wishlistOwnerId
						}) as '/'
					),
					{}
				);
				const response = await getWikiForgeCollectionPage(requestQuery(), {
					signal: controller.signal
				});
				if (controller.signal.aborted || currentRequest !== requestId) return;
				applyResponse(response, false);
			} catch (error) {
				if (
					currentRequest === requestId &&
					!(error instanceof DOMException && error.name === 'AbortError')
				) {
					failed = true;
				}
			} finally {
				if (requestController === controller) {
					requestController = null;
					loading = false;
				}
			}
		}, 500);
		return () => window.clearTimeout(filterTimer);
	});

	async function loadNext() {
		const position = nextCollectionPosition({ hasNext, nextCursor, page: responsePage });
		if (!position || loadingMore) return;
		loadingMore = true;
		loadMoreFailed = false;
		try {
			const response = await getWikiForgeCollectionPage(requestQuery(position));
			applyResponse(response, true);
		} catch {
			loadMoreFailed = true;
		} finally {
			loadingMore = false;
		}
	}

	function toggleCardSelection(cardId: string) {
		selectedCardIds = selectedCardIds.includes(cardId)
			? selectedCardIds.filter((id) => id !== cardId)
			: [...selectedCardIds, cardId];
	}

	function toggleSelectAll() {
		const visibleCardIds = cards.map((card) => card.id);
		const allSelected = visibleCardIds.every((cardId) => selectedCardIds.includes(cardId));
		selectedCardIds = allSelected ? [] : visibleCardIds;
	}

	async function applyTagToSelection() {
		if (!bulkTagIds.length || !selectedCardIds.length) return;
		const responses = await Promise.all(
			bulkTagIds.map((tagId) => applyWikiForgeTag(tagId, selectedCardIds))
		);
		const updatedCards = responses.flat();
		cards = mergeCards(cards, updatedCards);
		registerCards(updatedCards);
		selectedCardIds = [];
	}

	async function protectSelection() {
		const ids = cards
			.filter((card) => selectedCardIds.includes(card.id) && !card.userProtected)
			.map((card) => card.id);
		if (!ids.length) return;
		await Promise.all(ids.map((id) => protectWikiForgeCard(id)));
		const protectedIds = new Set(ids);
		cards = cards.map((card) =>
			protectedIds.has(card.id) ? { ...card, userProtected: true } : card
		);
		if (selectedCard && protectedIds.has(selectedCard.id)) {
			selectedCard = { ...selectedCard, userProtected: true };
		}
		selectedCardIds = [];
	}

	async function toggleWishlist(wishlistId: string, card: CardRecord, selected: boolean) {
		if (!selected) return;
		await addWishlistRegistryCard(
			wishlistId,
			'',
			String(card.baseCardId ?? card.catalogueId ?? card.id)
		);
		wishlists = await getWishlists();
	}

	async function toggleProtection(card: CardRecord) {
		if (card.userProtected) await unprotectWikiForgeCard(card.id);
		else await protectWikiForgeCard(card.id);
		const updated = { ...card, userProtected: !card.userProtected };
		cards = cards.map((item) => (item.id === card.id ? updated : item));
		selectedCard = updated;
	}

	function clearFilters() {
		query = '';
		sortBy = 'acquiredDate';
		selectedRarities = [];
		tagFilterIds = [];
		duplicate = 'all';
		protection = 'all';
		wishlistOwnerId = '';
	}
</script>

<section class="flex flex-col gap-6 pb-28 sm:gap-8">
	<PageHeader
		eyebrow={$_('collection.eyebrow')}
		title={$_('collection.title')}
		description={$_('collection.description')}
	/>
	<div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
		<FilterShell activeCount={activeFilterCount} description={$_('collection.filtersDescription')}>
			<FilterControls
				bind:query
				bind:sortBy
				bind:selectedRarities
				bind:tagFilterIds
				bind:duplicate
				bind:protected={protection}
				bind:wishlistOwnerId
				{wishlistOwners}
				{tags}
				untaggedOption="-1"
				rarityCounts={rarityResults}
				canonical
				onOpenTagEditor={() => (isTagEditorOpen = true)}
				onClear={clearFilters}
			/>
		</FilterShell>

		<div class="flex min-w-0 flex-col gap-6">
			<div class="flex flex-wrap items-center gap-2">
				<TagEditor bind:open={isTagEditorOpen} bind:tags bind:assignments />
				<Button
					size="sm"
					variant={isSelectionMode ? 'default' : 'outline'}
					aria-pressed={isSelectionMode}
					onclick={() => {
						isSelectionMode = !isSelectionMode;
						if (!isSelectionMode) {
							selectedCardIds = [];
							bulkTagIds = [];
						}
					}}
				>
					{$_('collection.selectCards')}
				</Button>
			</div>

			<CollectionResultSummary {total} loaded={cards.length} {hasNext} />
			{#if loading}
				<p class="forge-label">{$_('collection.loading')}</p>
			{:else if failed}
				<div class="forge-panel-flat flex flex-wrap items-center justify-between gap-3 p-4">
					<p class="text-destructive">{$_('collection.error')}</p>
					<Button variant="outline" onclick={() => (previousFilterKey = '')}
						>{$_('common.retry')}</Button
					>
				</div>
			{:else if cards.length}
				<CardGrid
					{cards}
					{tags}
					{assignments}
					{isSelectionMode}
					{selectedCardIds}
					onToggleCard={toggleCardSelection}
					onOpenCard={(card) => (selectedCard = card)}
				/>
				{#if hasNext || loadMoreFailed}
					<div class="flex flex-col items-center gap-2 border-t border-primary/20 pt-4">
						{#if loadMoreFailed}<p class="text-sm text-destructive">
								{$_('collection.load_more_error')}
							</p>{/if}
						<Button variant="outline" disabled={loadingMore} onclick={loadNext}>
							{loadingMore ? $_('collection.loading_more') : $_('collection.load_more')}
						</Button>
					</div>
				{/if}
			{:else}
				<EmptyState title={$_('collection.empty')} />
			{/if}
		</div>
	</div>

	{#if isSelectionMode}
		<SelectionPanel
			selectedCount={selectedCardIds.length}
			{tags}
			bind:bulkTagIds
			canProtect={selectedUnprotectedCount > 0}
			onSelectAll={toggleSelectAll}
			onApply={applyTagToSelection}
			onProtect={protectSelection}
			onOpenTagEditor={() => (isTagEditorOpen = true)}
			onCancel={() => {
				isSelectionMode = false;
				selectedCardIds = [];
				bulkTagIds = [];
			}}
		/>
	{/if}
</section>

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		owned
		loadVariantCopies={false}
		{wishlists}
		bind:tags
		bind:assignments
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onToggleProtection={() => void toggleProtection(selectedCard!)}
		onSaleCreated={(sale, userCardId) => {
			const summary: ActiveSaleSummary = {
				id: sale.id,
				type: sale.type,
				status: sale.status ?? 'active',
				price: sale.price,
				currentPrice: sale.currentPrice ?? sale.price,
				minimumBid: sale.minimumBid ?? Math.ceil(sale.price * 1.1),
				endsAt: sale.endsAt ?? null
			};
			cards = cards.map((card) =>
				card.id === userCardId ? { ...card, activeSale: summary } : card
			);
			if (selectedCard?.id === userCardId) selectedCard = { ...selectedCard, activeSale: summary };
		}}
		onClose={() => (selectedCard = null)}
	/>
{/if}
