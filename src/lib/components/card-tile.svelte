<script lang="ts">
	import { openCardDetail } from '$lib/components/cards/detail-state';
	import CardInformation from '$lib/components/cards/card-information.svelte';
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import type { CardRecord, CollectionTag } from '$lib/types';

	let {
		card,
		owned = false,
		showFriendOwners = true,
		showCollectionState = true,
		tags = [],
		comparisonOwnership,
		interactive = true,
		onOpen,
		onOrientationChange
	}: {
		card: CardRecord;
		owned?: boolean;
		showFriendOwners?: boolean;
		/** Masque les indicateurs propres à une collection (quantités, listes et protection). */
		showCollectionState?: boolean;
		tags?: CollectionTag[];
		comparisonOwnership?: { count: number; label: string };
		interactive?: boolean;
		onOpen?: (card: CardRecord) => void;
		onOrientationChange?: (landscape: boolean) => void;
	} = $props();

	function handleOpen() {
		if (onOpen) onOpen(card);
		else openCardDetail(card, owned);
	}
</script>

<article
	class="wikiforge-card-size arcade-tile"
	data-testid="card-tile"
	data-variant-id={card.variantId}
>
	<div class="card-slot">
		<div class="card-object">
			<VariantCardFace {card} {onOrientationChange} />
		</div>
		{#if interactive}<button
				type="button"
				class="card-inspect"
				aria-label={card.title}
				onclick={handleOpen}
			></button>{/if}
	</div>
	<CardInformation
		{card}
		{tags}
		{showFriendOwners}
		{showCollectionState}
		{comparisonOwnership}
		{interactive}
	/>
</article>

<style>
	.arcade-tile {
		width: 100%;
		max-width: none;
		min-width: 0;
	}
	.card-slot {
		aspect-ratio: 1/1.416;
		display: flex;
		align-items: center;
		position: relative;
		width: 100%;
		min-width: 0;
	}
	.card-object {
		width: 100%;
		max-height: 100%;
	}
	.card-inspect {
		position: absolute;
		inset: 0;
		cursor: pointer;
		border: 0;
		background: transparent;
		transition: background 120ms;
	}
	.card-inspect:hover {
		background: #e8ef420a;
	}
	.card-inspect:focus-visible {
		outline: 3px solid var(--primary);
		outline-offset: 3px;
	}
</style>
