<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { PublicWishlist } from '$lib/types';

	let {
		wishlists,
		onTrade
	}: {
		wishlists: PublicWishlist[];
		onTrade: (userCardId: string) => void;
	} = $props();
</script>

<div class="grid gap-6">
	{#each wishlists as wishlist (wishlist.id)}
		<section class="forge-panel min-w-0 p-4 sm:p-5">
			<header class="border-b border-dashed border-primary/25 pb-3">
				<h2 class="font-serif text-2xl font-black uppercase tracking-tight text-foreground">
					{wishlist.title}
				</h2>
				{#if wishlist.description}
					<p class="mt-1 font-serif text-sm italic text-muted-foreground">
						{wishlist.description}
					</p>
				{/if}
			</header>
			<div class="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
				{#each wishlist.cards as entry (entry.card.id)}
					<article class="min-w-0">
						<CardTile card={entry.card} showFriendOwners={false} />
						<p class="mt-2 min-h-8 font-mono text-[10px] uppercase tracking-widest text-primary">
							{entry.viewerOwnedCount > 0
								? $_('wishlist.viewer_owns', { values: { count: entry.viewerOwnedCount } })
								: $_('wishlist.viewer_does_not_own')}
						</p>
						{#if entry.viewerUserCardIds.length}
							<Button
								size="sm"
								class="mt-2 min-h-11 w-full whitespace-normal"
								onclick={() => onTrade(entry.viewerUserCardIds[0])}
							>
								{$_('wishlist.offer_card_trade')}
							</Button>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>
