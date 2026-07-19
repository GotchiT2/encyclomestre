<script lang="ts">
	import { resolve } from '$app/paths';
	import AuctionCountdown from '$lib/components/market/auction-countdown.svelte';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { salePricePresentation } from '$lib/domain/market/auction-display';
	import { _ } from '$lib/i18n';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import type { CardRecord, SaleListing } from '$lib/types';

	let {
		listings,
		cards,
		favoriteIds = [],
		onToggleFavorite
	}: {
		listings: SaleListing[];
		cards: CardRecord[];
		favoriteIds?: string[];
		onToggleFavorite?: (listingId: string) => void;
	} = $props();
	const cardsById = $derived(new Map(cards.map((card) => [card.id, card])));
</script>

<div
	class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3 lg:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]"
	data-testid="market-listings"
>
	{#each listings as listing (listing.id)}
		{@const card = cardsById.get(listing.cardId)}
		{@const price = salePricePresentation(listing)}
		{#if card}<article class="forge-panel-flat min-w-0 p-2">
				<div class="relative">
					<CardTile {card} showFriendOwners />
					<a
						href={resolve('/market/[id]', { id: listing.id })}
						class="absolute inset-0"
						aria-label={$_('market.open_listing')}
					></a>
				</div>
				<div class="mt-2 border-t border-primary/20 px-1 pt-2">
					<div class="flex items-start justify-between gap-2">
						<div>
							<p class="forge-label">
								{$_(price.label)}
							</p>
							<p class="mt-1 font-heading text-xl tracking-wide text-foreground">
								{price.amount}
								{listing.currency}
							</p>
						</div>
						<div class="flex gap-1">
							<Button
								size="icon-xs"
								variant={favoriteIds.includes(listing.id) ? 'default' : 'outline'}
								aria-label={$_('market.favorite')}
								onclick={() => onToggleFavorite?.(listing.id)}><HeartIcon /></Button
							>
							<Button
								href={resolve('/market/[id]', { id: listing.id })}
								size="icon-xs"
								variant="outline"
								aria-label={$_('market.open_listing')}><ExternalLinkIcon /></Button
							>
						</div>
					</div>
					{#if listing.status !== 'cancelled'}<AuctionCountdown endsAt={listing.endsAt} />{/if}
					<p class="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
						@{listing.sellerName}
					</p>
				</div>
			</article>{/if}
	{/each}
</div>
