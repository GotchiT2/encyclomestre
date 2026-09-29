<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import CatalogueFilters from '$lib/components/cards/catalogue-filters.svelte';
	import FilterShell from '$lib/components/layout/filter-shell.svelte';
	import CatalogueResultSummary from '$lib/components/cards/catalogue-result-summary.svelte';
	import CatalogueWishlistSelectionBar from '$lib/components/wishlist/catalogue-wishlist-selection-bar.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		addWishlistRegistryCard,
		addWishlistRegistryCards,
		getWikiForgePublicPage,
		getWishlists,
		toPublicPageCardRecord
	} from '$lib/api';
	import { _ } from '$lib/i18n';
	import { wikiForgeApiErrorCode } from '$lib/api/wikiforge-contract';
	import { toast } from 'svelte-sonner';
	import { restoreSession } from '$lib/auth/session';
	import type { CardRecord, WishlistRegistrySummary } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selectedCard = $state<CardRecord | null>(null);
	let detailRequest = $state(0);
	let wishlists = $state<WishlistRegistrySummary[]>([]);
	let selectionMode = $state(false);
	let selectedCardIds = $state<string[]>([]);
	let wishlistAdding = $state(false);

	onMount(async () => {
		const detail = page.url.searchParams.get('detail');
		if (detail && /^\d+$/.test(detail)) {
			const url = new URL(page.url);
			url.searchParams.delete('detail');
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- same resolved route, removing only the legacy detail parameter
			replaceState(url, page.state);
			void getWikiForgePublicPage(detail)
				.then((record) => {
					selectedCard = toPublicPageCardRecord(record);
				})
				.catch(() => toast.error($_('common.error')));
		}
		if (!restoreSession(localStorage)?.accessToken) return;
		wishlists = await getWishlists();
	});

	async function openCard(card: CardRecord) {
		if (selectionMode) {
			selectedCardIds = selectedCardIds.includes(card.id)
				? selectedCardIds.filter((id) => id !== card.id)
				: [...selectedCardIds, card.id];
			return;
		}
		const request = ++detailRequest;
		selectedCard = card;
		try {
			const detailedCard = toPublicPageCardRecord(await getWikiForgePublicPage(card.id));
			if (detailRequest === request && selectedCard?.id === card.id) selectedCard = detailedCard;
		} catch {
			// The catalogue summary stays usable if the provisional detail endpoint is unavailable.
		}
	}

	async function addSelectedToWishlist(wishlistId: string) {
		if (!selectedCardIds.length) return;
		wishlistAdding = true;
		try {
			await addWishlistRegistryCards(wishlistId, selectedCardIds);
			toast.success($_('codex.selection_added', { values: { count: selectedCardIds.length } }));
			selectedCardIds = [];
			selectionMode = false;
			wishlists = await getWishlists();
		} catch (error) {
			if (wikiForgeApiErrorCode(error) === 'WISHLIST_FULL') toast.error($_('wishlist.full_error'));
			else toast.error($_('common.error'));
		} finally {
			wishlistAdding = false;
		}
	}

	function closeCard() {
		detailRequest += 1;
		selectedCard = null;
	}

	async function toggleWishlist(wishlistId: string, cardId: string, selected: boolean) {
		if (!selected) return;
		try {
			await addWishlistRegistryCard(wishlistId, '', cardId);
		} catch (error) {
			if (wikiForgeApiErrorCode(error) === 'WISHLIST_FULL') {
				toast.error($_('wishlist.full_error'));
				return;
			}
			throw error;
		}
		toast.success($_('wishlist.card_added_generic'));
		wishlists = await getWishlists();
	}

	function pageHref(page: number) {
		const parameters = new SvelteURLSearchParams({
			page: String(page),
			q: data.filters.query,
			sortBy: data.filters.sortBy,
			sortDirection: data.filters.sortDirection
		});
		return `/cards?${parameters}`;
	}

	const activeFilterCount = $derived(
		(data.filters.query ? 1 : 0) +
			(data.filters.sortBy !== 'name' ? 1 : 0) +
			(data.filters.sortDirection === 'DESC' ? 1 : 0)
	);
</script>

<section class="flex flex-col gap-8">
	<PageHeader
		eyebrow={$_('codex.eyebrow')}
		title={$_('codex.title')}
		description={$_('codex.description')}
	/>
	<div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
		<FilterShell activeCount={activeFilterCount}>
			<CatalogueFilters
				query={data.filters.query}
				sortBy={data.filters.sortBy}
				sortDirection={data.filters.sortDirection}
			/>
		</FilterShell>

		<div class="flex min-w-0 flex-col gap-6">
			{#await data.cards}
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('codex.loading')}
				</p>
			{:then result}
				<div class="flex flex-wrap items-center gap-3">
					<div class="min-w-0 flex-1"><CatalogueResultSummary total={result.meta.total} /></div>
					{#if wishlists.length && !selectionMode}
						<Button size="sm" variant="outline" onclick={() => (selectionMode = true)}>
							{$_('codex.select_cards')}
						</Button>
					{/if}
				</div>
				{#if selectionMode}
					<CatalogueWishlistSelectionBar
						count={selectedCardIds.length}
						{wishlists}
						busy={wishlistAdding}
						onAdd={addSelectedToWishlist}
						onCancel={() => {
							selectionMode = false;
							selectedCardIds = [];
						}}
						onSelectAll={() => (selectedCardIds = result.items.map((card) => card.id))}
					/>
				{/if}
				{#if result.items.length}
					<div class="wikiforge-card-grid xl:grid-cols-6">
						{#each result.items as card (card.id)}
							<div class="relative w-full">
								<CardTile {card} onOpen={openCard} />
								{#if selectionMode}
									<button
										class={`absolute inset-0 z-20 flex items-start justify-end bg-primary/10 p-2 outline-none ring-inset ring-energy focus-visible:ring-2 ${selectedCardIds.includes(card.id) ? 'bg-primary/25' : ''}`}
										aria-label={$_('codex.toggle_card_selection', {
											values: { title: card.title }
										})}
										aria-pressed={selectedCardIds.includes(card.id)}
										onclick={() => openCard(card)}
									>
										<span
											class="flex size-6 items-center justify-center border border-primary bg-background/90 text-xs text-primary"
											>{selectedCardIds.includes(card.id) ? '✓' : ''}</span
										>
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState title={$_('codex.empty')} />
				{/if}
				{#if result.meta.total > 0}<nav
						class="flex items-center justify-between border-t border-primary/20 pt-5"
					>
						<Button
							href={pageHref(Math.max(1, result.meta.page - 1))}
							disabled={result.meta.page === 1}>{$_('codex.previous')}</Button
						>
						<span class="font-mono text-xs text-primary"
							>{result.meta.page} / {result.meta.totalPages}{#if result.meta.truncated}
								· {$_('apiEvolution.truncated', {
									values: { max: result.meta.maxResults ?? 10000 }
								})}{/if}</span
						>
						<Button
							href={pageHref(Math.min(result.meta.totalPages, result.meta.page + 1))}
							disabled={!(result.meta.hasNext ?? result.meta.page < result.meta.totalPages)}
							>{$_('codex.next')}</Button
						>
					</nav>{/if}
			{:catch}
				<p class="text-destructive">{$_('codex.error')}</p>
			{/await}
		</div>
	</div>
</section>

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		{wishlists}
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!.id, selected)}
		onClose={closeCard}
	/>
{/if}
