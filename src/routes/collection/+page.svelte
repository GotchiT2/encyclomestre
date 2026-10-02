<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import CollectionProgress from '$lib/components/collection/collection-progress.svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { currentSession } from '$lib/auth/session';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import CollectionResultSummary from '$lib/components/collection/collection-result-summary.svelte';
	import CompactFilters from '$lib/components/collection/compact-filters.svelte';
	import { arcadePreferences, updateArcadePreferences } from '$lib/arcade/preferences';
	import { removeWikiForgeTag } from '$lib/api/wikiforge';
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
		protectWikiForgeCards,
		unprotectWikiForgeCard,
		unprotectWikiForgeCards
	} from '$lib/api';
	import { invalidateArticleContexts } from '$lib/arcade/article-context';
	import { _ } from '$lib/i18n';
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import type {
		CardRecord,
		CollectionBooleanFilter,
		CollectionSort,
		CollectionTag,
		CollectionTagAssignments,
		User,
		WishlistRegistrySummary
	} from '$lib/types';
	import { toast } from 'svelte-sonner';
	import { operationError } from '$lib/domain/operation-error';
	import CardCession from '$lib/components/collection/card-cession.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let query = $state('');
	let sortBy = $state<CollectionSort>('acquiredDate');
	let variantIds = $state<number[]>([]);
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
	let previousFilterKey = $state('');
	let requestId = 0;
	let selling = $state<CardRecord | null>(null);
	const protecting = new SvelteSet<string>();
	onDestroy(() => requestController?.abort());
	let requestController: AbortController | null = null;
	let handledRealtimeRevision = 0;
	const selectedUnprotectedCount = $derived(
		cards.filter((card) => selectedCardIds.includes(card.id) && !card.userProtected).length
	);
	const selectedProtectedCount = $derived(
		cards.filter((card) => selectedCardIds.includes(card.id) && card.userProtected).length
	);

	const filterKey = $derived(
		JSON.stringify([
			effectiveCollectionQuery(query) ?? '',
			sortBy,
			variantIds,
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
			variantIds,
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
	}

	onMount(async () => {
		query = data.filters.query;
		sortBy = data.filters.sortBy;
		variantIds = data.filters.variantIds;
		tagFilterIds = data.filters.tagFilterIds;
		duplicate = data.filters.duplicate;
		protection = data.filters.protection;
		wishlistOwnerId = data.filters.wishlistOwnerId;
		const dependencies = Promise.allSettled([data.tags, getWishlists()]);
		try {
			const restoredCount = restoredSnapshot ? cards.length : 0;
			let collection = await data.collection;
			while (collection.hasNext && collection.items.length < restoredCount) {
				const position = nextCollectionPosition(collection);
				if (!position) break;
				const next = await getWikiForgeCollectionPage(requestQuery(position));
				collection = { ...next, items: mergeCards(collection.items, next.items) };
			}
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
				.filter((friendship) => friendship.status === 'accepted' && friendship.user.sharesWishlist)
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
							variantIds,
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
				if (controller.signal.aborted || currentRequest !== requestId || currentKey !== filterKey)
					return;
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

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			!ready ||
			refresh.revision === handledRealtimeRevision ||
			!refreshIncludes(refresh, 'collection')
		)
			return;
		handledRealtimeRevision = refresh.revision;
		// Réutilise la requête courante et son annulation, sans changer les filtres visibles.
		previousFilterKey = '';
	});

	async function loadNext() {
		const position = nextCollectionPosition({ hasNext, nextCursor, page: responsePage });
		if (!position || loadingMore || loading) return;
		const currentRequest = requestId;
		const currentFilter = filterKey;
		loadingMore = true;
		loadMoreFailed = false;
		try {
			const response = await getWikiForgeCollectionPage(requestQuery(position));
			if (currentRequest === requestId && currentFilter === filterKey)
				applyResponse(response, true);
		} catch {
			if (currentRequest === requestId && currentFilter === filterKey) loadMoreFailed = true;
		} finally {
			loadingMore = false;
		}
	}

	function toggleCardSelection(cardId: string) {
		selectedCardIds = selectedCardIds.includes(cardId)
			? selectedCardIds.filter((id) => id !== cardId)
			: selectedCardIds.length < 500
				? [...selectedCardIds, cardId]
				: selectedCardIds;
	}

	function toggleSelectAll() {
		const visibleCardIds = cards.map((card) => card.id).slice(0, 500);
		const allSelected = visibleCardIds.every((cardId) => selectedCardIds.includes(cardId));
		selectedCardIds = allSelected ? [] : visibleCardIds;
	}

	async function applyTagToSelection(remove = false) {
		if (!bulkTagIds.length || !selectedCardIds.length) return;
		const responses = await Promise.all(
			bulkTagIds.map((tagId) =>
				(remove ? removeWikiForgeTag : applyWikiForgeTag)(tagId, selectedCardIds)
			)
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
		await protectWikiForgeCards(ids);
		const protectedIds = new Set(ids);
		cards = cards.map((card) =>
			protectedIds.has(card.id) ? { ...card, userProtected: true } : card
		);
		if (selectedCard && protectedIds.has(selectedCard.id)) {
			selectedCard = { ...selectedCard, userProtected: true };
		}
		selectedCardIds = [];
	}

	async function unprotectSelection() {
		const ids = cards
			.filter((card) => selectedCardIds.includes(card.id) && card.userProtected)
			.map((card) => card.id);
		if (!ids.length) return;
		await unprotectWikiForgeCards(ids);
		const unprotectedIds = new Set(ids);
		cards = cards.map((card) =>
			unprotectedIds.has(card.id) ? { ...card, userProtected: false } : card
		);
		if (selectedCard && unprotectedIds.has(selectedCard.id)) {
			selectedCard = { ...selectedCard, userProtected: false };
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
		invalidateArticleContexts();
	}

	async function toggleProtection(card: CardRecord) {
		if (protecting.has(card.id)) return;
		protecting.add(card.id);
		try {
			if (card.userProtected) await unprotectWikiForgeCard(card.id);
			else await protectWikiForgeCard(card.id);
			const updated = { ...card, userProtected: !card.userProtected };
			cards = cards.map((item) => (item.id === card.id ? updated : item));
			if (selectedCard?.id === card.id) selectedCard = updated;
			if (protection !== 'all') previousFilterKey = '';
		} catch (cause) {
			toast.error(operationError(cause));
		} finally {
			protecting.delete(card.id);
		}
	}

	function clearFilters() {
		query = '';
		sortBy = 'acquiredDate';
		variantIds = [];
		tagFilterIds = [];
		duplicate = 'all';
		protection = 'all';
		wishlistOwnerId = '';
	}
	let restoredSnapshot = false;
	export const snapshot = {
		capture: () => ({
			cards,
			total,
			responsePage,
			nextCursor,
			hasNext,
			query,
			sortBy,
			variantIds,
			tagFilterIds,
			duplicate,
			protection,
			wishlistOwnerId,
			assignments
		}),
		restore: (value: {
			cards: CardRecord[];
			total: number;
			responsePage: number;
			nextCursor: string | null;
			hasNext: boolean;
			query: string;
			sortBy: typeof sortBy;
			variantIds: number[];
			tagFilterIds: string[];
			duplicate: typeof duplicate;
			protection: typeof protection;
			wishlistOwnerId: string;
			assignments: typeof assignments;
		}) => {
			restoredSnapshot = true;
			cards = value.cards;
			total = value.total;
			responsePage = value.responsePage;
			nextCursor = value.nextCursor;
			hasNext = value.hasNext;
			query = value.query;
			sortBy = value.sortBy;
			variantIds = value.variantIds;
			tagFilterIds = value.tagFilterIds;
			duplicate = value.duplicate;
			protection = value.protection;
			wishlistOwnerId = value.wishlistOwnerId;
			assignments = value.assignments;
			previousFilterKey = filterKey;
			loading = false;
		}
	};
</script>

<section class="flex flex-col gap-6 pb-28 sm:gap-8">
	<PageHeader
		eyebrow={$_('collection.eyebrow')}
		title={$_('collection.title')}
		description={$_('collection.description')}
	/>
	<CollectionProgress />
	<div class="grid gap-4">
		<CompactFilters
			bind:query
			bind:sortBy
			bind:variantIds
			bind:tagFilterIds
			bind:duplicate
			bind:protected={protection}
			bind:wishlistOwnerId
			{wishlistOwners}
			{tags}
			onOpenTagEditor={() => (isTagEditorOpen = true)}
			onClear={clearFilters}
		/>

		<div class="flex min-w-0 flex-col gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<TagEditor showTrigger={false} bind:open={isTagEditorOpen} bind:tags bind:assignments />
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
					{$_('arcade.select')}
				</Button>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex gap-1" aria-label={$_('arcade.density')}>
					{#each ['grid', 'list'] as density (density)}<Button
							variant={$arcadePreferences.density === density ? 'default' : 'outline'}
							aria-pressed={$arcadePreferences.density === density}
							onclick={() => updateArcadePreferences({ density: density as 'grid' | 'list' })}
							>{$_('arcade.' + density)}</Button
						>{/each}
				</div>
				<CollectionResultSummary {total} loaded={cards.length} {hasNext} />
			</div>
			{#if loading && !cards.length}
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
					density={$arcadePreferences.density}
					{cards}
					{tags}
					{assignments}
					{isSelectionMode}
					{selectedCardIds}
					quickActions
					onToggleCard={toggleCardSelection}
					onOpenCard={(card) => (selectedCard = card)}
					onProtect={(card) => void toggleProtection(card)}
					onSell={(card) => (selling = card)}
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
			canUnprotect={selectedProtectedCount > 0}
			onSelectAll={toggleSelectAll}
			onApply={() => applyTagToSelection()}
			onRemove={() => applyTagToSelection(true)}
			onProtect={protectSelection}
			onUnprotect={unprotectSelection}
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
		{wishlists}
		bind:tags
		bind:assignments
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onToggleProtection={() => void toggleProtection(selectedCard!)}
		onClose={() => (selectedCard = null)}
	/>
{/if}

<Dialog.Root
	open={Boolean(selling)}
	onOpenChange={(value) => {
		if (!value) selling = null;
	}}
	><Dialog.Content class="max-h-[90dvh] overflow-y-auto"
		><Dialog.Header class="pr-8"
			><Dialog.Title>{selling?.title}</Dialog.Title><Dialog.Description
				>{$_('plan.cards.cede')}</Dialog.Description
			></Dialog.Header
		>{#if selling}<CardCession
				card={selling}
				onChanged={() => (previousFilterKey = '')}
			/>{/if}</Dialog.Content
	></Dialog.Root
>
