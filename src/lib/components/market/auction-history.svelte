<script lang="ts">
	import { _ } from '$lib/i18n';
	import { resolve } from '$app/paths';
	import type { Auction } from '$lib/types';
	let { auction }: { auction: Auction } = $props();
	const date = (value: string) =>
		Number.isFinite(Date.parse(value))
			? new Intl.DateTimeFormat('fr', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(value)
				)
			: '—';
</script>

<details open class="auction-history" data-testid="auction-history">
	<summary class="min-h-11 py-2 text-xl">{$_('auctionHub.bidHistory')} · {auction.nbBids}</summary>
	<p class="mb-3 text-xs text-muted-foreground">{$_('auctionHub.bidHistoryLimit')}</p>
	{#each auction.bids ?? [] as bid, index (index)}
		<div
			class="flex flex-wrap items-start justify-between gap-2 border-t border-border py-3 text-sm"
		>
			<div>
				{#if bid.user}<a href={resolve('/users/[id]', { id: bid.user.id })} class="underline"
						>{bid.user.name}</a
					>{:else}{$_('auctionHub.hiddenPlayer')}{/if}
				{#if bid.auto}<p class="text-xs text-muted-foreground">{$_('market.auction_auto')}</p>{/if}
			</div>
			<div class="text-right">
				<strong>{bid.amount.toLocaleString('fr')} ◈</strong><time
					datetime={bid.date}
					class="block text-xs text-muted-foreground">{date(bid.date)}</time
				>
			</div>
		</div>
	{:else}<p class="py-3 text-sm text-muted-foreground">
			{$_(auction.nbBids > 0 ? 'auctionHub.historyRefreshing' : 'auctionHub.noBids')}
		</p>{/each}
</details>

<style>
	.auction-history {
		border-top: 1px solid var(--border);
	}
</style>
