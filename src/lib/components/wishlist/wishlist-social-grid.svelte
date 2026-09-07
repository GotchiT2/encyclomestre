<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { WishlistPageEntry } from '$lib/types';

	let {
		entries,
		editable,
		onRemove,
		selectionMode = false,
		selectedPageIds = [],
		onToggleSelection,
		onOpen
	}: {
		entries: WishlistPageEntry[];
		editable: boolean;
		onRemove: (pageId: string) => void | Promise<void>;
		selectionMode?: boolean;
		selectedPageIds?: string[];
		onToggleSelection?: (pageId: string) => void;
		onOpen: (entry: WishlistPageEntry) => void;
	} = $props();
</script>

{#if entries.length}
	<div class="wikiforge-card-grid" data-testid="wishlist-card-grid">
		{#each entries as entry (entry.card.id)}
			<article class="wikiforge-card-size relative isolate">
				<CardTile
					card={entry.card}
					onOpen={() =>
						selectionMode
							? onToggleSelection?.(String(entry.card.baseCardId ?? entry.card.id))
							: onOpen(entry)}
				/>
				{#if selectionMode && selectedPageIds.includes(String(entry.card.baseCardId ?? entry.card.id))}
					<span class="pointer-events-none absolute inset-0 z-40 border-2 border-energy bg-energy/15" aria-hidden="true"></span>
				{/if}
				{#if editable}
					<Button
						size="icon-xs"
						variant="destructive"
						class="absolute top-2 right-2 z-40 shadow-lg"
						aria-label={$_('wishlist.remove')}
						onclick={() => void onRemove(String(entry.card.baseCardId ?? entry.card.id))}>×</Button
					>
				{/if}
			</article>
		{/each}
	</div>
{:else}
	<p class="border border-dashed border-primary/30 bg-card p-5 italic text-muted-foreground">
		{$_('wishlist.empty_state')}
	</p>
{/if}
