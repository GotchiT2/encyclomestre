<script lang="ts">
	import AuctionFavorite from './auction-favorite.svelte';
	import { goto } from '$app/navigation';
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

<div class="arcade-card-grid auction-grid">
	{#each items as auction (auction.id)}
		{@const href =
			'/market/' + encodeURIComponent(auction.id) + '?from=' + encodeURIComponent(from)}
		{@const phase = auctionPhase(auction, now)}
		{@const personalState = auction.leading
			? 'leading'
			: ['OUTBID', 'LOST'].includes(auction.viewerOutcome ?? '') ||
				  (auction.myMax != null && phase === 'open')
				? 'outbid'
				: 'neutral'}
		<article class="auction-tile" data-auction-id={auction.id}>
			<div class="auction-art">
				<CardTile
					card={auction.card}
					showCollectionState={false}
					showFriendOwners={false}
					onOpen={() => void goto(resolve(href as '/market'))}
				/>
				{#if auction.seller.id === userId}<span class="own-auction">{$_('auctionHub.own')}</span
					>{/if}
			</div>
			<div class="min-w-0 space-y-2">
				<div class="flex items-center justify-between gap-1">
					<AuctionStatus {auction} {now} />
					{#if userId}<AuctionFavorite compact id={auction.id} favorite={auction.favorite} />{/if}
				</div>
				<a
					href={resolve(href as '/market')}
					class="block break-words text-sm font-semibold leading-tight hover:text-primary"
					>{auction.card.title}</a
				>
				<p class="text-xs text-muted-foreground">{auction.card.variant.name}</p>
				<p class="auction-price text-xl font-bold tabular-nums" data-bid-state={personalState}>
					{(auction.price ?? auction.startPrice).toLocaleString('fr')} ◈
					<span class="sr-only"
						>{$_(
							personalState === 'leading'
								? 'auctionHub.leading'
								: personalState === 'outbid'
									? 'auctionDisplay.outbid'
									: 'auctionDisplay.currentPrice'
						)}</span
					>
				</p>
				<p class="text-xs text-muted-foreground">
					{$_('auctionHub.bids', { values: { count: auction.nbBids } })}
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
				{#if auction.myMax != null && auction.status === 'OPEN'}<p
						class="text-xs text-muted-foreground"
					>
						{$_('auctionHub.myMax')} : {auction.myMax}
					</p>{/if}
			</div>
		</article>
	{:else}<p class="forge-panel-flat p-6 text-sm text-muted-foreground">
			{$_('auctionHub.noResults')}
		</p>{/each}
</div>

<style>
	.auction-art {
		position: relative;
		width: 100%;
		max-width: 144px;
		justify-self: center;
	}
	.own-auction {
		position: absolute;
		top: 5px;
		right: 5px;
		z-index: 4;
		max-width: calc(100% - 10px);
		padding: 3px 6px;
		background: #e8ef42;
		color: #171918;
		font-size: 10px;
		font-weight: 700;
		line-height: 1.1;
		pointer-events: none;
	}
	.auction-price {
		color: var(--primary);
	}
	.auction-price[data-bid-state='leading'] {
		color: #8ad6a3;
	}
	.auction-price[data-bid-state='outbid'] {
		color: #ee7967;
	}
	.auction-tile {
		display: grid;
		gap: 8px;
		min-width: 0;
		border-bottom: 1px solid var(--border);
		padding-bottom: 12px;
	}
	.auction-tile :global(.arcade-tile) {
		margin-inline: auto;
	}
	.auction-tile :global(.card-information) {
		display: none;
	}
	.auction-tile :global([data-slot='badge']) {
		max-width: 100%;
		white-space: normal;
		line-height: 1.2;
		font-size: 11px;
	}
</style>
