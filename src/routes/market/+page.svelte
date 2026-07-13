<script lang="ts">
	import { onMount } from 'svelte';
	import { getCards, getMarketListings } from '$lib/api';
	import MarketListings from '$lib/components/market/market-listings.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRecord, SaleListing } from '$lib/types';

	let cards = $state<CardRecord[]>([]);
	let listings = $state<SaleListing[]>([]);
	let query = $state('');
	let type = $state<SaleListing['type']>('auction');
	let maxPrice = $state('');
	let loading = $state(true);
	let selectedListing = $state<SaleListing | null>(null);
	let activeTab = $state<'all' | 'mine' | 'bids' | 'history'>('all');
	let historyTab = $state<'sold' | 'bought'>('sold');
	let favoriteIds = $state<string[]>([]);

	onMount(async () => {
		favoriteIds = JSON.parse(localStorage.getItem('market-favorites') ?? '[]');
		cards = (await getCards({ page: 1, pageSize: 100 })).items;
		await refresh();
	});

	async function refresh() {
		loading = true;
		listings = await getMarketListings({
			query,
			type: 'auction',
			maxPrice: Number(maxPrice) || undefined,
			sellerId:
				activeTab === 'mine' || (activeTab === 'history' && historyTab === 'sold')
					? 'demo-user'
					: undefined,
			bidderId:
				activeTab === 'bids' || (activeTab === 'history' && historyTab === 'bought')
					? 'demo-user'
					: undefined
		});
		loading = false;
	}

	function toggleFavorite(id: string) {
		favoriteIds = favoriteIds.includes(id)
			? favoriteIds.filter((item) => item !== id)
			: [...favoriteIds, id];
		localStorage.setItem('market-favorites', JSON.stringify(favoriteIds));
	}
</script>

<section class="flex flex-col gap-6 pb-12">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('market.eyebrow')}
		</p>
		<h1
			class="mt-3 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
		>
			{$_('market.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('market.description')}</p>
	</header>
	<div class="flex flex-wrap border border-primary/30 bg-card p-1" role="tablist">
		{#each [['all', 'market.tab_all'], ['mine', 'market.tab_mine'], ['bids', 'market.tab_bids'], ['history', 'market.tab_history']] as tab (tab[0])}<button
				class="h-10 px-3 font-mono text-[10px] uppercase tracking-widest {activeTab === tab[0]
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
		class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_8rem_auto]"
		onsubmit={(event) => {
			event.preventDefault();
			void refresh();
		}}
	>
		<Input bind:value={query} placeholder={$_('market.search')} /><select
			bind:value={type}
			class="h-10 border-2 border-primary/40 bg-card px-3 font-mono text-[10px] uppercase tracking-widest text-primary"
			><option value="all">{$_('market.all_types')}</option><option value="auction"
				>{$_('market.auction')}</option
			><option value="direct">{$_('market.direct_sale')}</option></select
		><Input
			bind:value={maxPrice}
			type="number"
			min="0"
			placeholder={$_('market.max_price')}
		/><Button type="submit">{$_('common.filter')}</Button>
	</form>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('market.loading')}
		</p>{:else if listings.length}<MarketListings
			{listings}
			{cards}
			showAction={activeTab === 'all' || activeTab === 'bids'}
			{favoriteIds}
			onToggleFavorite={toggleFavorite}
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
