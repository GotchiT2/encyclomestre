<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import CatalogueFilters from '$lib/components/cards/catalogue-filters.svelte';
	import CatalogueResultSummary from '$lib/components/cards/catalogue-result-summary.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { addWishlistRegistryCard, getWishlists, removeWishlistRegistryCard } from '$lib/api';
	import { _ } from '$lib/i18n';
	import { restoreSession } from '$lib/auth/session';
	import type { CardRecord, WishlistRegistrySummary } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let selectedCard = $state<CardRecord | null>(null);
	let wishlists = $state<WishlistRegistrySummary[]>([]);

	onMount(async () => {
		if (!restoreSession(localStorage)?.accessToken) return;
		wishlists = await getWishlists();
	});

	async function openCard(card: CardRecord) {
		selectedCard = card;
	}

	async function toggleWishlist(wishlistId: string, cardId: string, selected: boolean) {
		if (selected) await addWishlistRegistryCard(wishlistId, '', cardId);
		else await removeWishlistRegistryCard(wishlistId, '', cardId);
		wishlists = wishlists.map((wishlist) =>
			wishlist.id === wishlistId
				? {
						...wishlist,
						cardIds: selected
							? [...new Set([...wishlist.cardIds, cardId])]
							: wishlist.cardIds.filter((id) => id !== cardId)
					}
				: wishlist
		);
	}

	function pageHref(page: number) {
		const parameters = new SvelteURLSearchParams({
			page: String(page),
			q: data.filters.query,
			sortBy: data.filters.sortBy,
			sortDirection: data.filters.sortDirection
		});
		data.filters.selectedRarities.forEach((rarity) => parameters.append('rarity', rarity));
		return `/cards?${parameters}`;
	}
</script>

<section class="flex flex-col gap-8">
	<PageHeader
		eyebrow={$_('codex.eyebrow')}
		title={$_('codex.title')}
		description={$_('codex.description')}
	/>
	<CatalogueFilters
		query={data.filters.query}
		sortBy={data.filters.sortBy}
		sortDirection={data.filters.sortDirection}
		selectedRarities={data.filters.selectedRarities}
	/>
	{#await data.cards}
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('codex.loading')}
		</p>
	{:then result}
		<CatalogueResultSummary total={result.meta.total} rarityResults={result.rarityResults} />
		{#if result.items.length}
			<div class="wikiforge-card-grid">
				{#each result.items as card (card.id)}
					<CardTile {card} onOpen={openCard} />
				{/each}
			</div>
		{:else}
			<EmptyState title={$_('collection.empty')} />
		{/if}
		<nav class="flex items-center justify-between border-t border-primary/20 pt-5">
			<Button href={pageHref(Math.max(1, result.meta.page - 1))} disabled={result.meta.page === 1}
				>{$_('codex.previous')}</Button
			>
			<span class="font-mono text-xs text-primary"
				>{result.meta.page} / {result.meta.totalPages}</span
			>
			<Button
				href={pageHref(Math.min(result.meta.totalPages, result.meta.page + 1))}
				disabled={result.meta.page === result.meta.totalPages}>{$_('codex.next')}</Button
			>
		</nav>
	{:catch}
		<p class="text-destructive">{$_('codex.error')}</p>
	{/await}
</section>

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		loadVariantCopies={false}
		{wishlists}
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!.id, selected)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
