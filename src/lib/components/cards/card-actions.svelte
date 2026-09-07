<script lang="ts">
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

<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
	<WishlistActionMenu {wishlists} cardTitle={card.title} onToggle={onToggleWishlist} />
</div>
