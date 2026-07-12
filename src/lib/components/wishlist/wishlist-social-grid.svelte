<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRecord, FriendOwnerInfo } from '$lib/types';

	let {
		cards,
		onRemove,
		onInitiateTrade
	}: {
		cards: CardRecord[];
		onRemove: (cardId: string) => void;
		onInitiateTrade: (card: CardRecord, friend: FriendOwnerInfo) => void;
	} = $props();
</script>

{#if cards.length}
	<div class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
		{#each cards as card (card.id)}
			<article class="border border-primary/25 bg-card p-2">
				<div class="relative">
					<CardTile {card} showFriendOwners={false} />
					<Button
						size="icon-xs"
						variant="destructive"
						class="absolute top-2 right-2 z-20 border-destructive bg-destructive text-white shadow-lg hover:bg-destructive/90"
						aria-label={$_('wishlist.remove')}
						onclick={() => onRemove(card.id)}>×</Button
					>
				</div>
				<div class="mt-2 border-t border-dashed border-primary/20 pt-2">
					{#if card.friendsWhoOwn.length}
						<p class="font-mono text-[9px] uppercase tracking-widest text-emerald-300">
							{$_('wishlist.trade_match_alert')}
						</p>
						<p class="mt-1 font-mono text-[9px] uppercase tracking-widest text-primary">
							{$_('wishlist.friends_inventory_title')}
						</p>
						<div class="mt-2 flex flex-wrap gap-1">
							{#each card.friendsWhoOwn as friend (friend.friendId)}
								<Button
									size="xs"
									variant="outline"
									class="h-auto max-w-full gap-1 py-1 text-left"
									onclick={() => onInitiateTrade(card, friend)}
								>
									<img
										src={friend.avatarUrl}
										alt=""
										class="size-4 border border-primary/40 object-cover"
									/>
									<span class="truncate">@{friend.username} (×{friend.ownedCount})</span>
								</Button>
							{/each}
						</div>
					{:else}
						<p class="font-serif text-xs italic text-muted-foreground">
							{$_('wishlist.no_friends_own')}
						</p>
					{/if}
				</div>
			</article>
		{/each}
	</div>
{:else}
	<p
		class="border border-dashed border-primary/30 bg-card p-5 font-serif italic text-muted-foreground"
	>
		{$_('wishlist.empty_state')}
	</p>
{/if}
