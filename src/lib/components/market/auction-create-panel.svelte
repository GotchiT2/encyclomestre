<script lang="ts">
	import { _ } from '$lib/i18n';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import { page } from '$app/state';
	import type { CardRecord } from '$lib/types';
	import { createAuction } from '$lib/api/auctions';
	import { activeAuctionByCard, personalAuctions, recordOwnAuction } from '$lib/auctions/store';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import { validAmount, validAuctionPeriod, creationFee } from '$lib/auctions/presentation';
	import { auctionErrorKey } from '$lib/auctions/errors';
	import { Button } from '$lib/components/ui/button';
	import AuctionConfirmation from './auction-confirmation.svelte';
	import { toast } from 'svelte-sonner';
	let { card }: { card: CardRecord } = $props();
	let price = $state<number | undefined>();
	let startsAt = $state('');
	let endsAt = $state('');
	let busy = $state(false);
	let confirm = $state(false);
	let error = $state('');
	const existing = $derived(card.activeAuctionId ?? $activeAuctionByCard.get(card.id));
	const available = $derived(
		$personalAuctions.loaded &&
			!$personalAuctions.error &&
			!existing &&
			!card.userProtected &&
			!card.pendingTradeId &&
			!card.activeSale &&
			$personalAuctions.sales.filter((item) => item.status === 'OPEN').length < 3
	);
	function valid() {
		return (
			available &&
			price !== undefined &&
			validAmount(price) &&
			validAuctionPeriod(
				startsAt ? Date.parse(startsAt) : Date.now(),
				Date.parse(endsAt),
				Date.now(),
				Boolean(startsAt)
			)
		);
	}
	function prepare() {
		error = '';
		if (!valid()) {
			error = $_('auctionHub.periodError');
			return;
		}
		confirm = true;
	}
	async function submit() {
		if ($activeRestrictions.includes('TRADE')) return;
		if (busy) return;
		if (!valid()) {
			error = $_('auctionHub.periodError');
			confirm = false;
			return;
		}
		busy = true;
		error = '';
		try {
			const auction = await createAuction({
				cardId: Number(card.id),
				startPrice: price!,
				...(startsAt ? { startsAt: new Date(startsAt).toISOString().slice(0, 19) } : {}),
				endsAt: new Date(endsAt).toISOString().slice(0, 19)
			});
			recordOwnAuction(auction);
			publishRealtimeRefresh(['profile', 'collection']);
			toast.success($_('market.auction_saved'));
		} catch (cause) {
			error = $_(auctionErrorKey(cause));
		} finally {
			busy = false;
			confirm = false;
		}
	}
</script>

<SanctionNotice kind="TRADE" />

<section class="space-y-3 border-t border-primary/20 pt-4">
	<h3 class="forge-label">{$_('auctionHub.create')}</h3>
	{#if existing}
		<p class="text-sm text-muted-foreground">{$_('market.auction_card_locked')}</p>
		<Button
			href={'/market/' +
				existing +
				'?from=' +
				encodeURIComponent(page.url.pathname + page.url.search)}>{$_('auctionHub.details')}</Button
		>
	{:else if available}
		<form
			onsubmit={(event) => {
				event.preventDefault();
				prepare();
			}}
			class="space-y-3"
		>
			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.startPrice')}<input
					type="number"
					min="1"
					max="1000000000000"
					step="1"
					required
					bind:value={price}
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				/></label
			>
			<div class="grid gap-3 xl:grid-cols-2">
				<label class="grid min-w-0 gap-1 text-sm"
					>{$_('auctionHub.starts')}<input
						type="datetime-local"
						bind:value={startsAt}
						class="h-11 min-w-0 max-w-full border border-primary/25 bg-background px-3"
					/></label
				>
				<label class="grid min-w-0 gap-1 text-sm"
					>{$_('auctionHub.ends')}<input
						type="datetime-local"
						required
						bind:value={endsAt}
						class="h-11 min-w-0 max-w-full border border-primary/25 bg-background px-3"
					/></label
				>
			</div>
			<p class="text-xs text-muted-foreground">{$_('auctionHub.periodError')}</p>
			<p class="text-sm">
				{$_('auctionHub.fee', { values: { amount: creationFee(price ?? 0) } })}
				{$_('auctionHub.settlementFee')}
			</p>
			<Button type="submit" disabled={busy || $activeRestrictions.includes('TRADE')}
				>{$_('market.confirm_sale')}</Button
			>
		</form>
	{:else}<p class="text-sm text-muted-foreground">
			{$_(
				$personalAuctions.error
					? 'auctionHub.personalError'
					: !$personalAuctions.loaded
						? 'auctionHub.loading'
						: 'market.auction_card_locked'
			)}
		</p>{/if}
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
</section>
<AuctionConfirmation
	bind:open={confirm}
	{busy}
	title={$_('auctionHub.createConfirm')}
	description={card.title +
		' · ' +
		card.variant.name +
		'\n' +
		$_('auctionHub.startPrice') +
		' : ' +
		price +
		'\n' +
		$_('auctionHub.fee', { values: { amount: creationFee(price ?? 0) } }) +
		' ' +
		$_('auctionHub.settlementFee')}
	onConfirm={() => void submit()}
/>
