<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import WishlistActionMenu from '$lib/components/wishlist/wishlist-action-menu.svelte';
	import type { CardRecord, WishlistRegistrySummary } from '$lib/types';
	let {
		card,
		wishlists = [],
		onToggleWishlist
	}: {
		card: CardRecord;
		wishlists?: WishlistRegistrySummary[];
		onToggleWishlist: (wishlistId: string, selected: boolean) => void | Promise<void>;
	} = $props();
</script>

<div class="grid grid-cols-2 gap-2">
	<Button
		class="h-auto min-h-11 min-w-0 whitespace-normal px-2 text-center"
		variant="outline"
		href={'/market?pageId=' +
			encodeURIComponent(String(card.baseCardId ?? card.catalogueId ?? card.id)) +
			'&title=' +
			encodeURIComponent(card.title)}>{$_('navigation.auctions')}</Button
	>
	<WishlistActionMenu {wishlists} cardTitle={card.title} onToggle={onToggleWishlist} />
</div>
