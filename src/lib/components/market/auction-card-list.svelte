<script lang="ts">
	import AuctionFavorite from './auction-favorite.svelte';
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import type { Auction } from '$lib/types';
	import CardTile from '$lib/components/card-tile.svelte';
	import AuctionStatus from './auction-status.svelte';
	import AuctionCountdown from './auction-countdown.svelte';
	import { auctionPhase } from '$lib/auctions/presentation';
	let {
		items,
		from = '/market',
		now = Date.now(),
		userId
	}: { items: Auction[]; from?: string; now?: number; userId?: string } = $props();
</script>

<div class="grid gap-4 xl:grid-cols-2">
	{#each items as auction (auction.id)}
		{@const href =
			'/market/' + encodeURIComponent(auction.id) + '?from=' + encodeURIComponent(from)}
		{@const phase = auctionPhase(auction, now)}
		<article
			class="forge-panel grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 p-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4 sm:p-4"
			data-auction-id={auction.id}
		>
			<CardTile card={auction.card} showCollectionState={false} showFriendOwners={false} />
			<div class="min-w-0 space-y-2">
				<div class="flex flex-wrap gap-2">
					<AuctionStatus {auction} {now} />
					{#if userId}<AuctionFavorite
							id={auction.id}
							favorite={auction.favorite}
						/>{/if}{#if auction.seller.id === userId}<span
							class="self-center text-xs text-muted-foreground">{$_('auctionHub.own')}</span
						>{/if}
				</div>
				<a
					href={resolve(href as '/market')}
					class="block break-words font-serif text-lg leading-tight hover:text-primary"
					>{auction.card.title}</a
				>
				<p class="text-xs text-muted-foreground">{auction.card.variant.name}</p>
				<p class="text-lg font-bold text-primary">
					{(auction.price ?? auction.startPrice).toLocaleString('fr')} ◈
					<span class="text-xs font-normal text-muted-foreground"
						>· {$_('auctionHub.bids', { values: { count: auction.nbBids } })}</span
					>
				</p>
				<p class="text-xs text-muted-foreground">
					{$_('auctionHub.seller')} :
					<a class="underline" href={resolve('/users/[id]', { id: auction.seller.id })}
						>{auction.seller.name}</a
					>
				</p>
				{#if phase === 'open' || phase === 'upcoming'}<div class="text-xs">
						<AuctionCountdown
							endsAt={phase === 'upcoming' ? auction.startsAt : auction.endsAt}
							mode={phase === 'upcoming' ? 'start' : 'end'}
						/>
					</div>{/if}
				{#if auction.leading && auction.status === 'OPEN'}<p class="text-xs text-energy">
						{$_('auctionHub.leading')}{#if auction.myMax != null}
							· {$_('auctionHub.myMax')} : {auction.myMax}{/if}
					</p>{/if}
			</div>
		</article>
	{:else}<p class="forge-panel-flat p-6 text-sm text-muted-foreground">
			{$_('auctionHub.noResults')}
		</p>{/each}
</div>
