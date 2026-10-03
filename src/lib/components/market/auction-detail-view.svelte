<script lang="ts">
	import { onDestroy } from 'svelte';
	import { _ } from '$lib/i18n';
	import type { Auction } from '$lib/types';
	import type { UserIdentity } from '$lib/api/player-profile';
	import { createAuctionPlayerCache } from '$lib/auctions/player-cache';
	import { auctionPhase } from '$lib/auctions/presentation';
	import AuctionFavorite from './auction-favorite.svelte';
	import AuctionStatus from './auction-status.svelte';
	import AuctionCountdown from './auction-countdown.svelte';
	import AuctionCardDetail from './auction-card-detail.svelte';
	import AuctionBidPanel from './auction-bid-panel.svelte';
	import AuctionSellerPanel from './auction-seller-panel.svelte';
	import AuctionDock from './auction-dock.svelte';
	import AuctionHistory from './auction-history.svelte';
	import AuctionInformation from './auction-information.svelte';
	import AuctionPlayer from './auction-player.svelte';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
	let {
		auction,
		userId,
		now,
		onUpdated,
		onConflict
	}: {
		auction: Auction;
		userId?: string;
		now: number;
		onUpdated: (value: Auction) => void;
		onConflict: () => Promise<void>;
	} = $props();
	const phase = $derived(auctionPhase(auction, now));
	let players = $state<Record<string, UserIdentity | null>>({});
	let cache = createAuctionPlayerCache();
	let cachedFor: string | undefined;
	$effect(() => {
		if (cachedFor !== userId) {
			cache.dispose();
			cache = createAuctionPlayerCache();
			cachedFor = userId;
			players = {};
		}
		const ids = [
			...new Set([auction.seller.id, auction.leader?.id].filter((id): id is string => Boolean(id)))
		];
		let active = true;
		for (const id of ids)
			void cache.get(id).then((value) => {
				if (active) players[id] = value;
			});
		return () => {
			active = false;
		};
	});
	onDestroy(() => cache.dispose());
</script>

<header class="auction-heading">
	<div class="flex flex-wrap items-center gap-3">
		<p class="forge-label">{$_('market.auction_details')} · #{auction.id}</p>
		<AuctionStatus {auction} {now} />
		{#if userId}<AuctionFavorite id={auction.id} favorite={auction.favorite} />{/if}
	</div>
	<h1 class="break-words font-serif text-3xl sm:text-4xl">{auction.card.title}</h1>
	<div class="flex flex-wrap items-center gap-3">
		<AuctionPlayer
			player={auction.seller}
			identity={players[auction.seller.id]}
			label={$_('auctionHub.seller')}
		/>
		{#if auction.seller.id === userId}<span class="text-sm text-primary"
				>{$_('auctionHub.own')}</span
			>
		{:else}<ReportDialog
				target={{ type: 'USER', id: Number(auction.seller.id) }}
				title={auction.seller.name}
				userId={Number(auction.seller.id)}
			/>{/if}
	</div>
</header>
<div class="auction-inspection">
	<div class="auction-album">
		<AuctionCardDetail card={auction.card} />
		<AuctionHistory {auction} />
	</div>
	<AuctionDock>
		<section class="auction-state" data-dock-state aria-label={$_('market.auction_details')}>
			<div class="auction-price">
				<div>
					<p class="forge-label">
						{$_(auction.price == null ? 'auctionHub.startPrice' : 'auctionHub.price')}
					</p>
					<p
						class="price-value"
						class:leading={auction.leading}
						class:outbid={auction.viewerOutcome === 'LOST' ||
							auction.viewerOutcome === 'OUTBID' ||
							(!auction.leading && auction.myMax != null)}
					>
						{(auction.price ?? auction.startPrice).toLocaleString('fr')} ◈
					</p>
				</div>
				{#if phase === 'open' || phase === 'upcoming'}<AuctionCountdown
						endsAt={phase === 'upcoming' ? auction.startsAt : auction.endsAt}
						mode={phase === 'upcoming' ? 'start' : 'end'}
						prominent
					/>{:else}<AuctionStatus {auction} {now} />{/if}
			</div>
			<div class="auction-context">
				<div class="min-w-0">
					{#if auction.nbBids > 0}
						{#if auction.leader}<AuctionPlayer
								player={auction.leader}
								identity={players[auction.leader.id]}
								label={$_(phase === 'sold' ? 'auctionHub.winner' : 'auctionHub.leader')}
							/>{:else}<p class="text-sm">{$_('auctionHub.hiddenPlayer')}</p>{/if}
					{:else}<p class="text-sm text-muted-foreground">{$_('auctionHub.noBids')}</p>{/if}
				</div>
				<AuctionInformation {auction} />
			</div>
			{#if auction.viewerOutcome}<p class="text-sm" class:text-energy={auction.leading}>
					{$_('apiEvolution.outcome.' + auction.viewerOutcome, { default: auction.viewerOutcome })}
				</p>{:else if auction.leading}<p class="text-sm text-energy">
					{$_('auctionHub.leading')}
				</p>{/if}
		</section>
		{#if userId === auction.seller.id}<AuctionSellerPanel
				{auction}
				{now}
				{onUpdated}
				{onConflict}
			/>
		{:else if userId && auction.status === 'OPEN'}<AuctionBidPanel
				{auction}
				{now}
				{onUpdated}
				{onConflict}
			/>{/if}
	</AuctionDock>
</div>

<style>
	.auction-heading {
		display: grid;
		gap: 10px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 16px;
	}
	.auction-inspection {
		display: grid;
		gap: 24px;
		align-items: start;
		min-width: 0;
	}
	.auction-album {
		display: grid;
		gap: 24px;
		min-width: 0;
	}
	.auction-state {
		display: grid;
		gap: 8px;
	}
	.auction-price {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 12px;
	}
	.price-value {
		font-family: 'Barlow Condensed', sans-serif;
		font-size: 2rem;
		font-weight: 800;
		line-height: 1.1;
		color: var(--primary);
	}
	.price-value.leading {
		color: var(--energy);
	}
	.price-value.outbid {
		color: var(--destructive);
	}
	.auction-context {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	@media (min-width: 1024px) {
		.auction-inspection {
			grid-template-columns: minmax(0, 1fr) minmax(350px, 440px);
			gap: 32px;
		}
		.price-value {
			font-size: 2.5rem;
		}
	}
</style>
