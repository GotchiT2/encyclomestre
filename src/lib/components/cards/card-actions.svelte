<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import WishlistActionMenu from '$lib/components/wishlist/wishlist-action-menu.svelte';
	import { _ } from '$lib/i18n';
	import type { CardRecord, WishlistRegistrySummary } from '$lib/types';
	let {
		card,
		wishlists = [],
		onToggleWishlist,
		onTrade,
		canSell = false,
		activeSaleId,
		onSell,
		onViewSale
	}: {
		card: CardRecord;
		wishlists?: WishlistRegistrySummary[];
		onToggleWishlist: (wishlistId: string, selected: boolean) => void | Promise<void>;
		onTrade: () => void;
		canSell?: boolean;
		activeSaleId?: string;
		onSell: () => void;
		onViewSale: (saleId: string) => void;
	} = $props();
</script>

<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
	<WishlistActionMenu
		cardId={card.catalogueId ?? card.id}
		{wishlists}
		onToggle={onToggleWishlist}
	/>
	<Button variant="outline" disabled={!card.friendsWhoOwn.length} onclick={onTrade}
		>{$_('cardDetail.trade')}</Button
	>
	{#if canSell}
		<Button variant="outline" onclick={onSell}>{$_('cardDetail.sell')}</Button>
	{/if}
	{#if activeSaleId}
		<Button variant="outline" onclick={() => onViewSale(activeSaleId)}>
			{$_('cardDetail.view_sale')}
		</Button>
	{/if}
</div>
