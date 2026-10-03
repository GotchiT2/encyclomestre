<script lang="ts">
	import { _ } from '$lib/i18n';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import type { Auction } from '$lib/types';
	import { bidAuction, retractAuctionMax } from '$lib/api/auctions';
	import { ApiError } from '$lib/api/client';
	import { auctionErrorKey } from '$lib/auctions/errors';
	import { auctionPhase, validAmount, minimumAuctionBid } from '$lib/auctions/presentation';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
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
	const inputId = $props.id();
	let confirmedAmount = $state<number>();
	const minimum = $derived(minimumAuctionBid(auction));
	const valid = $derived(amount !== undefined && validAmount(amount) && amount >= minimum);
	const open = $derived(auctionPhase(auction, now) === 'open');
	const restricted = $derived($activeRestrictions.includes('TRADE'));
	const invalid = $derived(amount !== undefined && !valid);
	async function submit(kind: 'bid' | 'retract', submittedAmount?: number) {
		if (
			busy ||
			!open ||
			(kind === 'bid' &&
				(restricted ||
					submittedAmount === undefined ||
					!validAmount(submittedAmount) ||
					submittedAmount < minimum))
		) {
			confirm = false;
			return;
		}
		busy = true;
		error = '';
		try {
			const next =
				kind === 'bid'
					? await bidAuction(auction.id, submittedAmount!)
					: await retractAuctionMax(auction.id);
			if (kind === 'bid') amount = undefined;
			onUpdated(next);
			toast.success($_(next.leading ? 'market.auction_bid_result' : 'market.auction_outbid'));
		} catch (cause) {
			error = $_(auctionErrorKey(cause));
			if (cause instanceof ApiError && cause.status === 409) {
				try {
					await onConflict();
				} catch {
					error = $_('auctionHub.conflictRefreshError');
				}
			}
		} finally {
			busy = false;
			confirm = false;
		}
	}
	function prepare(kind: 'bid' | 'retract') {
		if (busy || !open || (kind === 'bid' && (!valid || restricted))) return;
		error = '';
		action = kind;
		confirmedAmount = amount;
		confirm = true;
	}
</script>

<SanctionNotice kind="TRADE" />

<section class="bid-panel" aria-label={$_('auctionHub.placeBid')}>
	<h2 class="sr-only">
		{$_(auction.leading ? 'auctionHub.raiseBid' : 'auctionHub.placeBid')}
	</h2>
	{#if auction.leading}<p class="text-sm text-energy">
			{$_('auctionHub.myMax')} : {auction.myMax ?? '—'} ◈
		</p>{/if}
	<form
		class="bid-line"
		novalidate
		onsubmit={(event) => {
			event.preventDefault();
			prepare('bid');
		}}
	>
		<Field.Field data-invalid={invalid}>
			<Field.Label for={inputId}>{$_('auctionHub.maxAmount')}</Field.Label>
			<input
				id={inputId}
				type="number"
				min={minimum}
				max="1000000000000"
				step="1"
				bind:value={amount}
				oninput={() => (error = '')}
				disabled={busy || !open}
				aria-invalid={invalid}
				aria-describedby={`${inputId}-minimum${invalid ? ' ' + inputId + '-invalid' : ''}`}
				class="h-11 w-full min-w-0 border border-border bg-background px-3 text-lg"
			/>
		</Field.Field>
		<Button type="submit" disabled={!valid || busy || !open || restricted}>
			{$_(auction.leading ? 'auctionHub.raiseBid' : 'auctionHub.placeBid')}
		</Button>
	</form>
	<p id={`${inputId}-minimum`} class="text-xs text-muted-foreground">
		{$_('auctionHub.minimumBid')} : {minimum.toLocaleString('fr')} ◈
	</p>
	{#if invalid}<p id={`${inputId}-invalid`} class="text-sm text-destructive">
			{$_(validAmount(amount!) ? 'auctionHub.belowMinimum' : 'auctionHub.invalidAmount', {
				values: { amount: minimum.toLocaleString('fr') }
			})}
		</p>{/if}
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
	<div class="flex flex-wrap gap-2">
		<Button
			variant="outline"
			disabled={busy || !open || restricted || !validAmount(minimum)}
			onclick={() => void submit('bid', minimum)}
		>
			{$_('auctionHub.quickBid', { values: { amount: minimum.toLocaleString('fr') } })}
		</Button>
		{#if auction.leading && (auction.myMax ?? 0) > (auction.price ?? auction.startPrice)}
			<Button variant="outline" disabled={busy || !open} onclick={() => prepare('retract')}
				>{$_('auctionHub.retract')}</Button
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
					amount: confirmedAmount ?? 0,
					debit: Math.max(0, (confirmedAmount ?? 0) - (auction.leading ? (auction.myMax ?? 0) : 0))
				}
			})
		: $_('auctionHub.retractHelp')}
	onConfirm={() => void submit(action, confirmedAmount)}
/>

<style>
	.bid-panel {
		display: grid;
		gap: 8px;
		min-width: 0;
	}
	.bid-line {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(100px, 0.8fr);
		align-items: end;
		gap: 8px;
	}
	.bid-line :global([data-slot='field']) {
		gap: 4px;
		min-width: 0;
	}
	.bid-line :global(button) {
		height: auto;
		min-height: 44px;
	}
</style>
