<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, SaleListing } from '$lib/types';

	let {
		listings,
		cards,
		onAction
	}: { listings: SaleListing[]; cards: CardRecord[]; onAction: (listing: SaleListing) => void } =
		$props();
	const cardsById = $derived(new Map(cards.map((card) => [card.id, card])));
</script>

<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
	{#each listings as listing (listing.id)}
		{@const card = cardsById.get(listing.cardId)}
		{#if card}<article class="border border-primary/30 bg-card p-2">
				<CardTile {card} showFriendOwners={false} />
				<div class="mt-2 border-t border-dashed border-primary/20 pt-2">
					<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
						{listing.type === 'auction' ? $_('market.auction') : $_('market.direct_sale')}
					</p>
					<p class="mt-1 font-serif text-lg font-black text-foreground">
						{listing.price}
						{listing.currency}
					</p>
					<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
						@{listing.sellerName}
					</p>
					<Button size="sm" variant="outline" class="mt-2 w-full" onclick={() => onAction(listing)}
						>{listing.type === 'auction' ? $_('market.bid') : $_('market.buy')}</Button
					>
				</div>
			</article>{/if}
	{/each}
</div>
