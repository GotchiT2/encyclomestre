<script lang="ts">
	import { untrack } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import { getWishlists, addWishlistRegistryCard } from '$lib/api/wishlist';
	import type { WishlistRegistrySummary } from '$lib/types';
	import CardDetailModal from './card-detail-modal.svelte';
	import { openedCard, openedCardLayer, closeCardDetail } from './detail-state';
	import { afterNavigate } from '$app/navigation';
	let wishlists = $state<WishlistRegistrySummary[]>([]);
	let generation = 0;
	$effect(() => {
		const id = $openedCard?.id;
		const account = $currentSession?.user.id;
		const request = ++generation;
		wishlists = [];
		if (id && account)
			untrack(
				() =>
					void getWishlists()
						.then((items) => {
							if (request === generation) wishlists = items;
						})
						.catch(() => undefined)
			);
		return () => {
			generation++;
		};
	});
	afterNavigate(() => closeCardDetail());
</script>

{#if $openedCard}<CardDetailModal
		card={$openedCard}
		modalLayer={$openedCardLayer}
		onClose={closeCardDetail}
		{wishlists}
		onToggleWishlist={async (id, selected) => {
			if (selected && $openedCard) {
				const pageId =
					$openedCard.baseCardId ??
					$openedCard.catalogueId ??
					($openedCard.packId == null ? $openedCard.id : undefined);
				if (!pageId) throw new Error('Missing page identifier');
				await addWishlistRegistryCard(id, '', String(pageId));
			}
		}}
	/>{/if}
