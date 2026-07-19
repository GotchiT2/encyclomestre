<script lang="ts">
	import { onMount } from 'svelte';
	import {
		addSaleFavorite,
		getMarketListings,
		getSaleFavorites,
		removeSaleFavorite
	} from '$lib/api';
	import { currentSession } from '$lib/auth/session';
	import MarketListings from '$lib/components/market/market-listings.svelte';
	import MarketFilters from '$lib/components/market/market-filters.svelte';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, CardVariant, SaleListing } from '$lib/types';

	let cards = $state<CardRecord[]>([]);
	let listings = $state<SaleListing[]>([]);
	let query = $state('');
	let variant = $state<CardVariant>('all');
	let loading = $state(true);
	let activeTab = $state<'all' | 'mine' | 'bids' | 'history'>('all');
	let historyTab = $state<'sold' | 'bought'>('sold');
	let favoriteIds = $state<string[]>([]);
	let filterTimer: number | undefined;
	const visibleListings = $derived(
		listings.filter((listing) => {
			const card = cards.find((candidate) => candidate.id === listing.cardId);
			return card ? matchesCardVariant(card, variant) : variant === 'all';
		})
	);

	onMount(async () => {
		const favorites = await getSaleFavorites();
		favoriteIds = favorites.map((sale) => sale.id);
		await refresh();
	});

	async function refresh() {
		loading = true;
		listings = await getMarketListings({
			query,
			sellerId:
				activeTab === 'mine' || (activeTab === 'history' && historyTab === 'sold')
					? $currentSession?.user.id
					: undefined,
			bidderId:
				activeTab === 'bids' || (activeTab === 'history' && historyTab === 'bought')
					? $currentSession?.user.id
					: undefined
		});
		cards = listings.flatMap((listing) => (listing.card ? [listing.card] : []));
		loading = false;
	}

	function scheduleRefresh(delay = 400) {
		window.clearTimeout(filterTimer);
		filterTimer = window.setTimeout(() => void refresh(), delay);
	}

	async function toggleFavorite(id: string) {
		if (favoriteIds.includes(id)) {
			await removeSaleFavorite(id);
			favoriteIds = favoriteIds.filter((item) => item !== id);
		} else {
			await addSaleFavorite(id);
			favoriteIds = [...favoriteIds, id];
		}
	}
</script>

<section class="flex flex-col gap-6 pb-12">
	<PageHeader
		eyebrow={$_('market.eyebrow')}
		title={$_('market.title')}
		description={$_('market.description')}
	/>
	<div class="forge-panel-flat flex flex-wrap gap-1 p-1" role="tablist">
		{#each [['all', 'market.tab_all'], ['mine', 'market.tab_mine'], ['bids', 'market.tab_bids'], ['history', 'market.tab_history']] as tab (tab[0])}<button
				class="min-h-11 px-4 text-[10px] font-bold uppercase tracking-widest {activeTab === tab[0]
					? 'bg-primary text-primary-foreground'
					: 'text-primary'}"
				onclick={() => {
					activeTab = tab[0] as typeof activeTab;
					void refresh();
				}}>{$_(tab[1])}</button
			>{/each}
	</div>
	{#if activeTab === 'history'}<div class="flex gap-2">
			<Button
				size="sm"
				variant={historyTab === 'sold' ? 'default' : 'outline'}
				onclick={() => {
					historyTab = 'sold';
					void refresh();
				}}>{$_('market.history_sold')}</Button
			><Button
				size="sm"
				variant={historyTab === 'bought' ? 'default' : 'outline'}
				onclick={() => {
					historyTab = 'bought';
					void refresh();
				}}>{$_('market.history_bought')}</Button
			>
		</div>{/if}
	<MarketFilters
		bind:query
		bind:variant
		onSearch={() => scheduleRefresh(450)}
		onVariantChange={() => scheduleRefresh(80)}
	/>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('market.loading')}
		</p>{:else if visibleListings.length}<MarketListings
			listings={visibleListings}
			{cards}
			{favoriteIds}
			onToggleFavorite={(id) => void toggleFavorite(id)}
		/>{:else}<p
			class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
		>
			{$_('market.empty')}
		</p>{/if}
</section>
