<script lang="ts">
	import { openCardDetail } from '$lib/components/cards/detail-state';
	import CardInformation from '$lib/components/cards/card-information.svelte';
	import VariantCardFace from '$lib/components/cards/variant-card-face.svelte';
	import type { CardRecord, CollectionTag } from '$lib/types';
	import { _ } from 'svelte-i18n';
	import { Rotate3d } from '@lucide/svelte';

	let {
		card,
		owned = false,
		showFriendOwners = true,
		showCollectionState = true,
		tags = [],
		comparisonOwnership,
		inspection = false,
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
		inspection?: boolean;
		interactive?: boolean;
		onOpen?: (card: CardRecord) => void;
		onOrientationChange?: (landscape: boolean) => void;
	} = $props();

	function handleOpen() {
		if (onOpen) onOpen(card);
		else openCardDetail(card, owned);
	}
	let objectElement: HTMLDivElement;
	function inspectFinish() {
		const reduced =
			document.documentElement.dataset.motion === 'reduce' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		objectElement.animate(
			reduced
				? [{ opacity: 0.8 }, { opacity: 1 }]
				: [
						{ transform: 'perspective(700px) rotateY(0deg)' },
						{ transform: 'perspective(700px) rotateY(-12deg)', offset: 0.3 },
						{ transform: 'perspective(700px) rotateY(12deg)', offset: 0.7 },
						{ transform: 'perspective(700px) rotateY(0deg)' }
					],
			{ duration: reduced ? 120 : 550, easing: 'ease-in-out' }
		);
	}
</script>

<article
	class="wikiforge-card-size arcade-tile"
	class:inspection
	data-testid="card-tile"
	data-variant-id={card.variantId}
>
	<div
		class="card-slot"
		role="presentation"
		onpointermove={(event) => {
			if (
				event.pointerType !== 'mouse' ||
				document.documentElement.dataset.motion === 'reduce' ||
				window.matchMedia('(prefers-reduced-motion: reduce)').matches
			)
				return;
			const node = event.currentTarget;
			const bounds = node.getBoundingClientRect();
			node.style.setProperty(
				'--card-pointer',
				`${((event.clientX - bounds.left) / bounds.width) * 100}%`
			);
			node.style.setProperty(
				'--object-tilt',
				`${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`
			);
		}}
		onpointerleave={(event) => event.currentTarget.style.setProperty('--object-tilt', '0deg')}
	>
		<div class="card-object" bind:this={objectElement}>
			<VariantCardFace {card} {onOrientationChange} />
		</div>
		{#if interactive}<button
				type="button"
				class="card-inspect"
				aria-label={card.title}
				onclick={handleOpen}
			></button>{/if}
	</div>
	{#if inspection}<button type="button" class="finish-control" onclick={inspectFinish}
			><Rotate3d size={16} />{$_('arcade.inspectFinish')}</button
		>{/if}
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
		max-width: 160px;
		min-width: 0;
	}
	.card-slot {
		aspect-ratio: 1/1.416;
		display: flex;
		align-items: center;
		position: relative;
		width: min(100%, 144px);
		margin-inline: auto;
		min-width: 0;
	}
	.card-object {
		width: 100%;
		max-height: 100%;
		transform: perspective(700px) rotateY(var(--object-tilt, 0deg));
		transition: transform 120ms;
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
	.inspection {
		max-width: none;
	}
	.inspection .card-slot {
		width: 100%;
	}
	.finish-control {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		margin: 4px auto;
		font-size: 12px;
		padding: 0 12px;
		border: 1px solid var(--border);
		cursor: pointer;
	}
</style>
