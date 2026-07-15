<script lang="ts">
	import { onMount } from 'svelte';
	import {
		addSaleFavorite,
		getCard,
		getMarketListings,
		getSaleFavorites,
		removeSaleFavorite
	} from '$lib/api';
	import { currentSession } from '$lib/auth/session';
	import MarketListings from '$lib/components/market/market-listings.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRecord, CardVariant, SaleListing } from '$lib/types';

	let cards = $state<CardRecord[]>([]);
	let listings = $state<SaleListing[]>([]);
	let query = $state('');
	let type = $state<SaleListing['type'] | 'all'>('all');
	let maxPrice = $state('');
	let variant = $state<CardVariant>('all');
	let loading = $state(true);
	let selectedListing = $state<SaleListing | null>(null);
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
			type: type === 'all' ? undefined : type,
			maxPrice: Number(maxPrice) || undefined,
			sellerId:
				activeTab === 'mine' || (activeTab === 'history' && historyTab === 'sold')
					? $currentSession?.user.id
					: undefined,
			bidderId:
				activeTab === 'bids' || (activeTab === 'history' && historyTab === 'bought')
					? $currentSession?.user.id
					: undefined
		});
		cards = (
			await Promise.all(
				[...new Set(listings.map((listing) => listing.cardId))].map((cardId) =>
					getCard(cardId).catch(() => null)
				)
			)
		).filter((card): card is CardRecord => card !== null);
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
	<form
		class="forge-panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]"
		onsubmit={(event) => {
			event.preventDefault();
			void refresh();
		}}
	>
		<Input
			bind:value={query}
			placeholder={$_('market.search')}
			oninput={() => scheduleRefresh(450)}
		/><select bind:value={type} onchange={() => scheduleRefresh(80)}
			><option value="all">{$_('market.all_types')}</option><option value="auction"
				>{$_('market.auction')}</option
			><option value="direct">{$_('market.direct_sale')}</option></select
		><Input
			bind:value={maxPrice}
			type="number"
			min="0"
			placeholder={$_('market.max_price')}
			oninput={() => scheduleRefresh(350)}
		/>
	</form>
	<CardVariantSelector bind:value={variant} />
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('market.loading')}
		</p>{:else if visibleListings.length}<MarketListings
			listings={visibleListings}
			{cards}
			showAction={activeTab === 'all' || activeTab === 'bids'}
			{favoriteIds}
			onToggleFavorite={(id) => void toggleFavorite(id)}
			onAction={(listing) => (selectedListing = listing)}
		/>{:else}<p
			class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
		>
			{$_('market.empty')}
		</p>{/if}{#if selectedListing}<section
			class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
		>
			<div class="w-full max-w-md border-4 border-double border-primary/40 bg-card p-5">
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{selectedListing.type === 'auction' ? $_('market.auction') : $_('market.direct_sale')}
				</p>
				<h2 class="mt-2 font-serif text-2xl font-black uppercase">
					{selectedListing.price}
					{selectedListing.currency}
				</h2>
				<p class="mt-2 font-serif italic text-muted-foreground">{$_('market.action_hint')}</p>
				<div class="mt-5 flex justify-end gap-2">
					<Button variant="outline" onclick={() => (selectedListing = null)}
						>{$_('common.cancel')}</Button
					><Button onclick={() => (selectedListing = null)}
						>{selectedListing.type === 'auction' ? $_('market.bid') : $_('market.buy')}</Button
					>
				</div>
			</div>
		</section>{/if}
</section>
