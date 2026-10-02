<script lang="ts">
	import AuctionFavorite from './auction-favorite.svelte';
	import { _ } from '$lib/i18n';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
	import { resolve } from '$app/paths';
	import type { Auction } from '$lib/types';
	import { auctionPhase } from '$lib/auctions/presentation';
	import AuctionStatus from './auction-status.svelte';
	import AuctionCountdown from './auction-countdown.svelte';
	import AuctionCardDetail from './auction-card-detail.svelte';
	import AuctionBidPanel from './auction-bid-panel.svelte';
	import AuctionSellerPanel from './auction-seller-panel.svelte';
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
	const date = (value: string) =>
		new Intl.DateTimeFormat('fr', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(value)
		);
</script>

<header class="space-y-2 border-b border-border pb-4">
	<div class="flex flex-wrap items-center gap-3">
		<p class="forge-label">{$_('market.auction_details')} · #{auction.id}</p>
		<AuctionStatus {auction} {now} />
		{#if userId}<AuctionFavorite id={auction.id} favorite={auction.favorite} />{/if}
	</div>
	<h1 class="break-words font-serif text-3xl sm:text-4xl">{auction.card.title}</h1>
	<p class="text-sm text-muted-foreground">
		{$_('auctionHub.seller')} :
		<a href={resolve('/users/[id]', { id: auction.seller.id })} class="text-primary underline"
			>{auction.seller.name}</a
		>
		{#if auction.seller.id === userId}
			· {$_('auctionHub.own')}{/if}
	</p>
</header>
{#if auction.seller.id !== userId}<ReportDialog
		target={{ type: 'USER', id: Number(auction.seller.id) }}
		title={auction.seller.name}
		userId={Number(auction.seller.id)}
	/>{/if}
<div class="auction-inspection">
	<AuctionCardDetail card={auction.card} />
	<div class="auction-transaction min-w-0 space-y-5">
		<section class="forge-panel space-y-5 p-5" aria-label={$_('market.auction_details')}>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="forge-label">
						{$_(auction.price == null ? 'auctionHub.startPrice' : 'auctionHub.price')}
					</p>
					<p class="mt-1 text-3xl font-bold text-primary">
						{(auction.price ?? auction.startPrice).toLocaleString('fr')} ◈
					</p>
				</div>
				{#if phase === 'open' || phase === 'upcoming'}<AuctionCountdown
						endsAt={phase === 'upcoming' ? auction.startsAt : auction.endsAt}
						mode={phase === 'upcoming' ? 'start' : 'end'}
					/>{/if}
			</div>
			<dl class="grid gap-3 text-sm sm:grid-cols-2">
				{#if auction.viewerOutcome}<div>
						<dt>{$_('apiEvolution.outcomeLabel')}</dt>
						<dd>
							{$_('apiEvolution.outcome.' + auction.viewerOutcome, {
								default: auction.viewerOutcome
							})}
						</dd>
					</div>{/if}
				{#each ['listingFee', 'finalFee'] as field (field)}{@const amount =
						field === 'listingFee'
							? auction.listingFee
							: auction.finalFee}{#if amount !== undefined}<div>
							<dt>{$_('apiEvolution.' + field)}</dt>
							<dd>{amount} ◈</dd>
						</div>{/if}{/each}
				<div>
					<dt class="text-muted-foreground">{$_('auctionHub.starts')}</dt>
					<dd>{date(auction.startsAt)}</dd>
				</div>
				<div>
					<dt class="text-muted-foreground">{$_('auctionHub.ends')}</dt>
					<dd>{date(auction.endsAt)}</dd>
				</div>
				{#if auction.closedAt}<div>
						<dt class="text-muted-foreground">{$_('auctionHub.closed')}</dt>
						<dd>{date(auction.closedAt)}</dd>
					</div>{/if}
				{#if auction.nbBids > 0}<div>
						<dt class="text-muted-foreground">
							{$_(auction.status === 'SOLD' ? 'auctionHub.winner' : 'auctionHub.leader')}
						</dt>
						<dd>
							{#if auction.leader}<a
									href={resolve('/users/[id]', { id: auction.leader.id })}
									class="underline">{auction.leader.name}</a
								>{:else}{$_('auctionHub.hiddenPlayer')}{/if}
						</dd>
					</div>{/if}
			</dl>
			<p class="text-xs text-muted-foreground">
				{$_('auctionHub.bids', { values: { count: auction.nbBids } })} · {$_(
					'auctionHub.extensions',
					{ values: { count: auction.nbExtensions } }
				)}
			</p>
		</section>
		{#if userId === auction.seller.id}
			<AuctionSellerPanel {auction} {now} {onUpdated} {onConflict} />
		{:else if userId && auction.status === 'OPEN'}
			<AuctionBidPanel {auction} {now} {onUpdated} {onConflict} />
		{/if}
		<details class="space-y-3 border-t border-border pt-4">
			<summary class="min-h-11 text-xl">{$_('auctionHub.bidHistory')}</summary>
			<p class="text-xs text-muted-foreground">{$_('auctionHub.bidHistoryLimit')}</p>
			{#each auction.bids ?? [] as bid, index (index)}
				<div
					class="flex flex-wrap items-start justify-between gap-2 border-t border-primary/15 pt-3 text-sm"
				>
					<div>
						{#if bid.user}<a href={resolve('/users/[id]', { id: bid.user.id })} class="underline"
								>{bid.user.name}</a
							>{:else}{$_('auctionHub.hiddenPlayer')}{/if}{#if bid.auto}<p
								class="text-xs text-muted-foreground"
							>
								{$_('market.auction_auto')}
							</p>{/if}
					</div>
					<div class="text-right">
						<strong>{bid.amount.toLocaleString('fr')} ◈</strong><time
							datetime={bid.date}
							class="block text-xs text-muted-foreground">{date(bid.date)}</time
						>
					</div>
				</div>
			{:else}<p class="text-sm text-muted-foreground">{$_('auctionHub.noBids')}</p>{/each}
		</details>
	</div>
</div>

<style>
	.auction-inspection {
		display: grid;
		gap: 24px;
		align-items: start;
	}
	@media (min-width: 1024px) {
		.auction-inspection {
			grid-template-columns: minmax(0, 1fr) minmax(360px, 520px);
			gap: 48px;
		}
		.auction-transaction {
			position: sticky;
			top: 88px;
		}
	}
</style>
