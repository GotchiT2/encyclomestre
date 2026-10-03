<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { AuctionCard } from '$lib/types';
	import CardTile from '$lib/components/card-tile.svelte';
	import { openCardDetail } from '$lib/components/cards/detail-state';
	let { card }: { card: AuctionCard } = $props();
</script>

<section class="space-y-4" aria-label={$_('auctionHub.cardDetails')}>
	<div class="mx-auto w-full max-w-80">
		<CardTile
			inspection
			{card}
			showCollectionState={false}
			showFriendOwners={false}
			onOpen={() => openCardDetail(card)}
		/>
	</div>
	<p class="text-sm leading-relaxed text-muted-foreground">
		{card.longDescription || card.shortDescription}
	</p>
</section>
