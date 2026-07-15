<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import CatalogueFilters from '$lib/components/cards/catalogue-filters.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		addWishlistEntry,
		getWikiForgeCard,
		getWishlist,
		removeWishlistEntry,
		toCardRecord
	} from '$lib/api';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardRecord } from '$lib/types';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const rarities: CardRarity[] = cardRarityOptions.map((rarity) => rarity.value);
	let selectedCard = $state<CardRecord | null>(null);
	let wishlistedCardIds = $state<string[]>([]);

	onMount(async () => {
		wishlistedCardIds = (await getWishlist('', { page: 1, pageSize: 100 })).items.map(
			(entry) => entry.cardId
		);
	});

	async function openCard(card: CardRecord) {
		selectedCard = card;
		try {
			selectedCard = { ...card, ...toCardRecord(await getWikiForgeCard(card.id)) };
		} catch {
			selectedCard = card;
		}
	}

	async function toggleWishlist(cardId: string) {
		if (wishlistedCardIds.includes(cardId)) {
			await removeWishlistEntry('', cardId);
			wishlistedCardIds = wishlistedCardIds.filter((id) => id !== cardId);
		} else {
			await addWishlistEntry('', cardId);
			wishlistedCardIds = [...wishlistedCardIds, cardId];
		}
	}

	function pageHref(page: number) {
		const parameters = new SvelteURLSearchParams({
			page: String(page),
			q: data.filters.query,
			sortBy: data.filters.sortBy,
			sortDirection: data.filters.sortDirection
		});
		data.filters.selectedRarities.forEach((rarity) => parameters.append('rarity', rarity));
		parameters.set('variant', data.filters.variant);
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
		variant={data.filters.variant}
		{rarities}
	/>
	{#await data.cards}
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('codex.loading')}
		</p>
	{:then result}
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
		isWishlisted={wishlistedCardIds.includes(selectedCard.id)}
		onToggleWishlist={() => void toggleWishlist(selectedCard!.id)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
