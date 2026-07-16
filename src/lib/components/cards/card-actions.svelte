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
		onMarket,
		onSell
	}: {
		card: CardRecord;
		wishlists?: WishlistRegistrySummary[];
		onToggleWishlist: (wishlistId: string, selected: boolean) => void | Promise<void>;
		onTrade: () => void;
		onMarket: () => void;
		onSell: () => void;
	} = $props();
</script>

<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
	<WishlistActionMenu
		cardId={card.catalogueId ?? card.id}
		{wishlists}
		onToggle={onToggleWishlist}
	/>
	<Button variant="outline" disabled={!card.friendsWhoOwn.length} onclick={onTrade}
		>{$_('cardDetail.trade')}</Button
	>
	<Button variant="outline" onclick={onMarket}>{$_('cardDetail.market')}</Button>
	{#if card.ownedCount > 0}
		<Button variant="outline" onclick={onSell}>{$_('cardDetail.sell')}</Button>
	{/if}
</div>
