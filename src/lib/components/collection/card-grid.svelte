<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import type { CardRecord, CollectionTag, CollectionTagAssignments } from '$lib/types';

	let {
		cards,
		tags,
		assignments,
		isSelectionMode,
		selectedCardIds,
		onToggleCard,
		onOpenCard
	}: {
		cards: CardRecord[];
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
		isSelectionMode: boolean;
		selectedCardIds: string[];
		onToggleCard: (cardId: string) => void;
		onOpenCard?: (card: CardRecord) => void;
	} = $props();

	function cardTags(cardId: string) {
		return tags.filter((tag) => (assignments[cardId] ?? []).includes(tag.id));
	}
</script>

<div class="wikiforge-card-grid">
	{#each cards as card (card.id)}<div class="wikiforge-card-size relative isolate">
			<CardTile
				{card}
				tags={cardTags(card.id)}
				showFriendOwners
				onOpen={isSelectionMode ? undefined : onOpenCard}
			/>{#if isSelectionMode}<button
					type="button"
					class={cn(
						'absolute inset-0 z-50 h-full w-full cursor-pointer border-2 border-primary/60 bg-transparent p-0 transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-3px]',
						selectedCardIds.includes(card.id) && 'bg-primary/30 hover:bg-primary/35'
					)}
					data-testid="card-selection-overlay"
					aria-pressed={selectedCardIds.includes(card.id)}
					aria-label={selectedCardIds.includes(card.id)
						? $_('collection.deselectCard')
						: $_('collection.selectCard')}
					onclick={() => onToggleCard(card.id)}
					><span
						class={cn(
							'absolute top-2 left-2 z-40 flex size-6 items-center justify-center border border-primary bg-card font-mono text-xs font-black text-primary shadow-[0_0_12px_rgb(0_0_0_/_70%)] sm:top-3 sm:left-3 sm:size-7',
							selectedCardIds.includes(card.id) && 'bg-primary text-primary-foreground'
						)}
						data-testid="card-selection-checkbox"
						aria-hidden="true">{selectedCardIds.includes(card.id) ? '✓' : ''}</span
					></button
				>{/if}
		</div>{/each}
</div>
