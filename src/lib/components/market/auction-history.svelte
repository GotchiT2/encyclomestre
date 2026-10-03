<script lang="ts">
	import { _ } from '$lib/i18n';
	import { resolve } from '$app/paths';
	import type { Auction } from '$lib/types';
	import type { UserIdentity } from '$lib/api/player-profile';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { UserRound } from '@lucide/svelte';
	let {
		auction,
		players = {}
	}: { auction: Auction; players?: Record<string, UserIdentity | null> } = $props();
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
			{#if bid.user}<a
					href={resolve('/users/[id]', { id: bid.user.id })}
					class="bid-player"
					data-bid-player
				>
					<UserAvatar
						name={bid.user.name}
						image={players[bid.user.id]?.image}
						crop={players[bid.user.id]?.imageCrop}
						class="size-8"
					/>
					<span class="min-w-0"
						><span class="block break-words font-semibold">{bid.user.name}</span>
						{#if bid.auto}<span class="block text-xs text-muted-foreground"
								>{$_('market.auction_auto')}</span
							>{/if}</span
					>
				</a>
			{:else}<div class="bid-player">
					<UserRound class="size-8 shrink-0" aria-hidden="true" /><span
						>{$_('auctionHub.hiddenPlayer')}{#if bid.auto}<span
								class="block text-xs text-muted-foreground">{$_('market.auction_auto')}</span
							>{/if}</span
					>
				</div>{/if}
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
	.bid-player {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 8px;
		min-width: 0;
		min-height: 44px;
	}
</style>
