<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { getWikiForgeCard, toCardRecord } from '$lib/api';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardRecord } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const rarities: CardRarity[] = [
		'Commune',
		'Peu Commune',
		'Rare',
		'Super-Rare',
		'Ultra-Rare',
		'Légendaire',
		'KTD'
	];
	let selectedCard = $state<CardRecord | null>(null);
	let wishlistedCardIds = $state<string[]>([]);

	onMount(() => {
		wishlistedCardIds = JSON.parse(localStorage.getItem('encyclomestre.wishlist-cards') ?? '[]');
	});

	async function openCard(card: CardRecord) {
		selectedCard = card;
		try {
			selectedCard = { ...card, ...toCardRecord(await getWikiForgeCard(card.id)) };
		} catch {
			selectedCard = card;
		}
	}

	function toggleWishlist(cardId: string) {
		wishlistedCardIds = wishlistedCardIds.includes(cardId)
			? wishlistedCardIds.filter((id) => id !== cardId)
			: [...wishlistedCardIds, cardId];
		localStorage.setItem('encyclomestre.wishlist-cards', JSON.stringify(wishlistedCardIds));
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
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('codex.eyebrow')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('codex.title')}
		</h1>
		<p class="mt-3 font-serif italic text-muted-foreground">{$_('codex.description')}</p>
	</header>
	<form method="GET" class="border-4 border-double border-primary/30 bg-card p-3">
		<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]">
			<Input name="q" value={data.filters.query} placeholder={$_('codex.search')} />
			<select
				name="sortBy"
				class="h-10 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-widest text-primary"
			>
				<option value="rarity" selected={data.filters.sortBy === 'rarity'}
					>{$_('collection.sortRarity')}</option
				>
				<option value="name" selected={data.filters.sortBy === 'name'}
					>{$_('collection.sortName')}</option
				>
			</select>
			<select
				name="sortDirection"
				class="h-10 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-widest text-primary"
			>
				<option value="DESC" selected={data.filters.sortDirection === 'DESC'}>DESC</option>
				<option value="ASC" selected={data.filters.sortDirection === 'ASC'}>ASC</option>
			</select>
			<Button type="submit">{$_('common.filter')}</Button>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each rarities as rarity (rarity)}
				<label
					class="cursor-pointer border border-primary/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary"
				>
					<input
						type="checkbox"
						name="rarity"
						value={rarity}
						checked={data.filters.selectedRarities.includes(rarity)}
					/>
					{rarity}
				</label>
			{/each}
		</div>
	</form>
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
			<p class="border border-dashed border-primary/30 p-5 font-serif italic text-muted-foreground">
				{$_('collection.empty')}
			</p>
		{/if}
		<nav class="flex items-center justify-between border-t border-dashed border-primary/30 pt-5">
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
		onToggleWishlist={() => toggleWishlist(selectedCard!.id)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
