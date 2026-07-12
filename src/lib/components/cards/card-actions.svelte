<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	let {
		card,
		isWishlisted,
		onToggleWishlist,
		onTrade,
		onMarket,
		onSell
	}: {
		card: CardRecord;
		isWishlisted: boolean;
		onToggleWishlist: () => void;
		onTrade: () => void;
		onMarket: () => void;
		onSell: () => void;
	} = $props();
</script>

<div class="grid gap-2 sm:grid-cols-4">
	<Button variant={isWishlisted ? 'outline' : 'default'} onclick={onToggleWishlist}
		>{isWishlisted ? $_('cardDetail.remove_wishlist') : $_('cardDetail.add_wishlist')}</Button
	>
	<Button variant="outline" disabled={!card.friendsWhoOwn.length} onclick={onTrade}
		>{$_('cardDetail.trade')}</Button
	>
	<Button variant="outline" onclick={onMarket}>{$_('cardDetail.market')}</Button>
	{#if card.ownedCount > 0}
		<Button variant="outline" onclick={onSell}>{$_('cardDetail.sell')}</Button>
	{/if}
</div>
