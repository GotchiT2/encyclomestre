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
		onToggleCard
	}: {
		cards: CardRecord[];
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
		isSelectionMode: boolean;
		selectedCardIds: string[];
		onToggleCard: (cardId: string) => void;
	} = $props();

	function cardTags(cardId: string) {
		return tags.filter((tag) => (assignments[cardId] ?? []).includes(tag.id));
	}
</script>

<div
	class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
>
	{#each cards as card (card.id)}<div class="relative">
			<CardTile
				{card}
				tags={cardTags(card.id)}
				showFriendOwners={false}
			/>{#if isSelectionMode}<Button
					variant="ghost"
					class={cn(
						'absolute inset-0 size-auto rounded-none border-2 border-primary/60 bg-transparent p-0 hover:bg-primary/15',
						selectedCardIds.includes(card.id) && 'bg-primary/30 hover:bg-primary/35'
					)}
					aria-pressed={selectedCardIds.includes(card.id)}
					aria-label={selectedCardIds.includes(card.id)
						? $_('collection.deselectCard')
						: $_('collection.selectCard')}
					onclick={() => onToggleCard(card.id)}
					><span
						class={cn(
							'absolute top-2 left-2 flex size-10 items-center justify-center border-2 border-primary bg-card/95 font-mono text-base font-black text-primary',
							selectedCardIds.includes(card.id) && 'bg-primary text-primary-foreground'
						)}>{selectedCardIds.includes(card.id) ? '✓' : ''}</span
					></Button
				>{/if}
		</div>{/each}
</div>
