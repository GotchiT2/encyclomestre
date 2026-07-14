<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';
	import type { CardRecord, WishlistAlert, WishlistEntry } from '$lib/types';

	export type WishlistCard = WishlistEntry & { card: CardRecord; alerts: WishlistAlert[] };

	let {
		entries,
		page,
		totalPages,
		onEdit,
		onRemove,
		onPageChange
	}: {
		entries: WishlistCard[];
		page: number;
		totalPages: number;
		onEdit: (entry: WishlistEntry) => void;
		onRemove: (cardId: string) => void;
		onPageChange: (page: number) => void;
	} = $props();
</script>

{#if entries.length}
	<div class="wikiforge-card-grid">
		{#each entries as entry (entry.cardId)}
			<div class="wikiforge-card-size relative">
				<CardTile card={entry.card} showFriendOwners={false} />
				<div class="absolute top-2 right-2 z-20 flex gap-1">
					<Button
						size="icon-xs"
						variant="outline"
						aria-label={$_('wishlist.edit')}
						onclick={() => onEdit(entry)}><PencilIcon /></Button
					>
					<Button
						size="icon-xs"
						variant="destructive"
						aria-label={$_('wishlist.remove')}
						onclick={() => onRemove(entry.cardId)}><XIcon /></Button
					>
				</div>
				<div class="absolute right-2 bottom-2 left-2 z-20 flex flex-wrap items-center gap-1">
					<span
						class="border border-primary/60 bg-background/95 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary"
						>{$_(`wishlist.priority_${entry.priority}`)}</span
					>
					{#if entry.alerts.length}
						<span
							class="border border-emerald-400/60 bg-emerald-950/95 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-200"
							>{$_('wishlist.alert_count', { values: { count: entry.alerts.length } })}</span
						>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	<nav
		class="flex items-center justify-between border-t border-dashed border-primary/30 pt-5"
		aria-label={$_('wishlist.page')}
	>
		<Button variant="outline" disabled={page === 1} onclick={() => onPageChange(page - 1)}
			>{$_('codex.previous')}</Button
		>
		<p class="font-mono text-sm uppercase tracking-widest text-primary">
			{$_('wishlist.page')}
			{page} / {totalPages}
		</p>
		<Button variant="outline" disabled={page === totalPages} onclick={() => onPageChange(page + 1)}
			>{$_('codex.next')}</Button
		>
	</nav>
{:else}
	<p
		class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
	>
		{$_('wishlist.empty')}
	</p>
{/if}
