<script lang="ts">
	import { resolve } from '$app/paths';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, SaleListing } from '$lib/types';

	let {
		listings,
		cards,
		onAction,
		showAction = true,
		favoriteIds = [],
		onToggleFavorite
	}: {
		listings: SaleListing[];
		cards: CardRecord[];
		onAction: (listing: SaleListing) => void;
		showAction?: boolean;
		favoriteIds?: string[];
		onToggleFavorite?: (listingId: string) => void;
	} = $props();
	const cardsById = $derived(new Map(cards.map((card) => [card.id, card])));
</script>

<div class="wikiforge-card-grid">
	{#each listings as listing (listing.id)}
		{@const card = cardsById.get(listing.cardId)}
		{#if card}<article class="forge-panel-flat relative p-2">
				<CardTile {card} showFriendOwners={false} />
				<a
					href={resolve('/market/[id]', { id: listing.id })}
					class="absolute inset-x-0 top-0 z-10 aspect-[5/7]"
					aria-label={$_('market.open_listing')}
				></a>
				<div class="mt-2 border-t border-primary/20 px-1 pt-3 pb-1">
					<Button
						size="icon-xs"
						variant={favoriteIds.includes(listing.id) ? 'default' : 'outline'}
						class="relative z-20 float-right"
						aria-label={$_('market.favorite')}
						onclick={() => onToggleFavorite?.(listing.id)}>♥</Button
					>
					<p class="forge-label">
						{listing.type === 'auction' ? $_('market.auction') : $_('market.direct_sale')}
					</p>
					<p class="mt-1 font-heading text-xl tracking-wide text-foreground">
						{listing.price}
						{listing.currency}
					</p>
					<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
						@{listing.sellerName}
					</p>
					{#if showAction}<Button
							size="sm"
							variant="outline"
							class="relative z-20 mt-2 w-full"
							onclick={() => onAction(listing)}
							>{listing.type === 'auction' ? $_('market.bid') : $_('market.buy')}</Button
						>{/if}
				</div>
			</article>{/if}
	{/each}
</div>
