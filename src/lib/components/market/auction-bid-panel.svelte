<script lang="ts">
	import { _ } from '$lib/i18n';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import type { Auction } from '$lib/types';
	import { bidAuction, retractAuctionMax } from '$lib/api/auctions';
	import { ApiError } from '$lib/api/client';
	import { auctionErrorKey } from '$lib/auctions/errors';
	import { auctionPhase, validAmount } from '$lib/auctions/presentation';
	import { Button } from '$lib/components/ui/button';
	import AuctionConfirmation from './auction-confirmation.svelte';
	import { toast } from 'svelte-sonner';
	let {
		auction,
		now,
		onUpdated,
		onConflict
	}: {
		auction: Auction;
		now: number;
		onUpdated: (value: Auction) => void;
		onConflict: () => Promise<void>;
	} = $props();
	let amount = $state<number | undefined>();
	let busy = $state(false);
	let error = $state('');
	let confirm = $state(false);
	let action = $state<'bid' | 'retract'>('bid');
	const minimum = $derived(
		auction.leading ? (auction.myMax ?? auction.price ?? auction.startPrice) + 1 : auction.minBid
	);
	const valid = $derived(amount !== undefined && validAmount(amount) && amount >= minimum);
	const open = $derived(auctionPhase(auction, now) === 'open');
	async function submit() {
		if (busy || !open || (action === 'bid' && (!valid || $activeRestrictions.includes('TRADE')))) {
			confirm = false;
			return;
		}
		busy = true;
		error = '';
		try {
			const next =
				action === 'bid'
					? await bidAuction(auction.id, amount!)
					: await retractAuctionMax(auction.id);
			onUpdated(next);
			toast.success($_(next.leading ? 'market.auction_bid_result' : 'market.auction_outbid'));
		} catch (cause) {
			if (cause instanceof ApiError && cause.status === 409) await onConflict();
			error = $_(auctionErrorKey(cause));
		} finally {
			busy = false;
			confirm = false;
		}
	}
</script>

<SanctionNotice kind="TRADE" />

<section class="forge-panel space-y-4 p-4 sm:p-5">
	<h2 class="font-serif text-xl">
		{$_(auction.leading ? 'auctionHub.raiseBid' : 'auctionHub.placeBid')}
	</h2>
	{#if auction.leading}<p class="border-l-2 border-energy pl-3 text-energy">
			{$_('auctionHub.leading')} · {$_('auctionHub.myMax')} : {auction.myMax ?? '—'}
		</p>{/if}
	<p class="text-sm text-muted-foreground">{$_('market.auction_max_help')}</p>
	<p class="text-xs text-muted-foreground">{$_('market.auction_tie_help')}</p>
	<label class="grid gap-2 text-sm"
		>{$_('auctionHub.maxAmount')}
		<input
			type="number"
			min={minimum}
			max="1000000000000"
			step="1"
			bind:value={amount}
			disabled={busy || !open}
			class="h-12 min-w-0 border border-primary/30 bg-background px-3 text-lg"
		/>
	</label>
	<p class="text-sm">{$_('auctionHub.minimumBid')} : {minimum}</p>
	{#if amount !== undefined && !valid}<p class="text-sm text-destructive">
			{$_('auctionHub.invalidAmount')}
		</p>{/if}
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
	<div class="flex flex-wrap gap-2">
		<Button
			disabled={!valid || busy || !open || $activeRestrictions.includes('TRADE')}
			onclick={() => {
				action = 'bid';
				confirm = true;
			}}>{$_(auction.leading ? 'auctionHub.raiseBid' : 'auctionHub.placeBid')}</Button
		>
		{#if auction.leading && (auction.myMax ?? 0) > (auction.price ?? auction.startPrice)}
			<Button
				variant="outline"
				disabled={busy || !open}
				onclick={() => {
					action = 'retract';
					confirm = true;
				}}>{$_('auctionHub.retract')}</Button
			>
		{/if}
	</div>
	{#if !open}<p class="text-sm text-muted-foreground">{$_('market.auction_unavailable')}</p>{/if}
</section>
<AuctionConfirmation
	bind:open={confirm}
	{busy}
	title={$_(action === 'bid' ? 'auctionHub.bidConfirm' : 'auctionHub.retractConfirm')}
	description={action === 'bid'
		? $_('auctionHub.bidSummary', {
				values: {
					amount: amount ?? 0,
					debit: Math.max(0, (amount ?? 0) - (auction.leading ? (auction.myMax ?? 0) : 0))
				}
			})
		: $_('auctionHub.retractHelp')}
	onConfirm={() => void submit()}
/>
