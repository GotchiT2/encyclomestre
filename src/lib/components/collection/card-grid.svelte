<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import TagIcon from '@lucide/svelte/icons/tag';
	import type { CardRecord, CollectionTag, CollectionTagAssignments } from '$lib/types';

	let {
		cards,
		tags,
		assignments,
		isSelectionMode,
		selectedCardIds,
		quickActions = false,
		onToggleCard,
		onOpenCard,
		onProtect,
		onSell
	}: {
		cards: CardRecord[];
		tags: CollectionTag[];
		assignments: CollectionTagAssignments;
		isSelectionMode: boolean;
		selectedCardIds: string[];
		/** Affiche « Protéger » et « À vendre » au survol de la carte. */
		quickActions?: boolean;
		onToggleCard: (cardId: string) => void;
		onOpenCard?: (card: CardRecord) => void;
		onProtect?: (card: CardRecord) => void;
		onSell?: (card: CardRecord) => void;
	} = $props();

	function cardTags(cardId: string) {
		return tags.filter((tag) => (assignments[cardId] ?? []).includes(tag.id));
	}
</script>

<div class="wikiforge-card-grid">
	{#each cards as card (card.id)}<div class="wikiforge-card-size group relative isolate">
			<CardTile
				{card}
				tags={cardTags(card.id)}
				showFriendOwners
				onOpen={isSelectionMode ? undefined : onOpenCard}
			/>{#if quickActions && !isSelectionMode}
				<!-- Au-dessus de la zone cliquable de la tuile (z-30), sous la sélection multiple (z-50).
				     Visible au survol, au focus clavier, et en permanence sur pointeur grossier. -->
				<div
					class="pointer-events-none absolute inset-x-1 bottom-1 z-40 flex flex-col gap-1 opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 [@media(pointer:coarse)]:pointer-events-auto [@media(pointer:coarse)]:opacity-100"
					data-testid="card-quick-actions"
				>
					<button
						type="button"
						class="flex w-full min-w-0 items-center justify-center gap-1 border border-primary/60 bg-background/90 px-1 py-1.5 text-[9px] font-bold tracking-wider text-primary uppercase backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						aria-label={$_('collection.quick_protect_card', { values: { title: card.title } })}
						onclick={() => onProtect?.(card)}
					>
						<ShieldIcon class="size-3 shrink-0" />
						<span class="truncate">{$_('collection.quick_protect')}</span>
					</button>
					<button
						type="button"
						class="flex w-full min-w-0 items-center justify-center gap-1 border border-primary/60 bg-background/90 px-1 py-1.5 text-[9px] font-bold tracking-wider text-primary uppercase backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						aria-label={$_('collection.quick_sell_card', { values: { title: card.title } })}
						onclick={() => onSell?.(card)}
					>
						<TagIcon class="size-3 shrink-0" />
						<span class="truncate">{$_('collection.quick_sell')}</span>
					</button>
				</div>
			{/if}{#if isSelectionMode}<button
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
