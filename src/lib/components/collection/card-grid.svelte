<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
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
			/>{#if isSelectionMode}<Button
					variant="ghost"
					class={cn(
						'absolute inset-0 z-30 size-auto rounded-none border-2 border-primary/60 bg-transparent p-0 hover:bg-primary/15',
						selectedCardIds.includes(card.id) && 'bg-primary/30 hover:bg-primary/35'
					)}
					aria-pressed={selectedCardIds.includes(card.id)}
					aria-label={selectedCardIds.includes(card.id)
						? $_('collection.deselectCard')
						: $_('collection.selectCard')}
					onclick={() => onToggleCard(card.id)}
					><span
						class={cn(
							'absolute top-3 left-3 z-40 flex size-10 items-center justify-center border-2 border-primary bg-card font-mono text-base font-black text-primary shadow-[0_0_18px_rgb(0_0_0_/_70%)]',
							selectedCardIds.includes(card.id) && 'bg-primary text-primary-foreground'
						)}>{selectedCardIds.includes(card.id) ? '✓' : ''}</span
					></Button
				>{/if}
		</div>{/each}
</div>
