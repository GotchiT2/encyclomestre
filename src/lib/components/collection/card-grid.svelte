<script lang="ts">
	import { activeAuctionCardIds } from '$lib/auctions/store';
	import CardTile from '$lib/components/card-tile.svelte';
	import { _ } from '$lib/i18n';
	import { cn } from '$lib/utils';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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
		density = 'grid',
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
		density?: 'grid' | 'list';
		onToggleCard: (cardId: string) => void;
		onOpenCard?: (card: CardRecord) => void;
		onProtect?: (card: CardRecord) => void;
		onSell?: (card: CardRecord) => void;
	} = $props();

	function cardTags(cardId: string) {
		return tags.filter((tag) => (assignments[cardId] ?? []).includes(tag.id));
	}
</script>

<div class="arcade-card-grid" class:arcade-list={density === 'list'}>
	{#each cards as card (card.id)}<div class="wikiforge-card-size group relative isolate">
			<CardTile
				owned
				interactive={!isSelectionMode}
				{card}
				tags={cardTags(card.id)}
				showFriendOwners
				onOpen={isSelectionMode ? undefined : onOpenCard}
			/>{#if quickActions && !isSelectionMode}
				<DropdownMenu.Root
					><DropdownMenu.Trigger
						class="mt-1 flex min-h-11 w-full items-center justify-center gap-2 border border-border bg-card text-sm"
						data-testid="card-quick-actions">{$_('arcade.cardActions')} ···</DropdownMenu.Trigger
					><DropdownMenu.Content align="start" class="min-w-52">
						<DropdownMenu.Item
							class="min-h-11"
							disabled={!onProtect ||
								Boolean(
									card.pendingTradeId ||
									card.saleId ||
									card.activeAuctionId ||
									$activeAuctionCardIds.has(card.id)
								)}
							onSelect={() => onProtect?.(card)}
							><ShieldIcon />{$_(
								card.userProtected ? 'collection.unprotect' : 'collection.quick_protect'
							)}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							class="min-h-11"
							disabled={!onSell ||
								Boolean(
									card.userProtected ||
									card.saleId ||
									card.activeAuctionId ||
									$activeAuctionCardIds.has(card.id)
								)}
							onSelect={() => onSell?.(card)}
							><TagIcon />{$_('collection.quick_sell')}</DropdownMenu.Item
						>
					</DropdownMenu.Content></DropdownMenu.Root
				>
			{/if}{#if isSelectionMode}<button
					type="button"
					class={cn(
						'absolute inset-0 z-50 h-full w-full cursor-pointer border-2 border-primary/60 bg-transparent p-0 transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-3px]',
						selectedCardIds.includes(card.id) && 'bg-primary/10 hover:bg-primary/15'
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
