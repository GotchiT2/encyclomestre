<script lang="ts">
	import { _ } from '$lib/i18n';
	import { untrack } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import { page } from '$app/state';
	import type { CardRecord } from '$lib/types';
	import { createAuction, getAuctionFee, type AuctionFee } from '$lib/api/auctions';
	import {
		activeAuctionByCard,
		personalAuctions,
		recordOwnAuction,
		refreshPersonalAuctions
	} from '$lib/auctions/store';
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
	let quote = $state<AuctionFee>();
	let error = $state('');
	let loading = $state(false);
	const userId = $derived($currentSession?.user.id);
	const sameAccount = $derived(Boolean(userId && $personalAuctions.userId === userId));
	const existing = $derived(
		card.activeAuctionId ?? (sameAccount ? $activeAuctionByCard.get(card.id) : undefined)
	);
	$effect(() => {
		const id = userId;
		if (id && (!sameAccount || (!$personalAuctions.loaded && !$personalAuctions.error)))
			untrack(() => void loadAuctions(id));
	});
	async function loadAuctions(id: string) {
		loading = true;
		try {
			await refreshPersonalAuctions(id);
		} catch {
			// The shared store exposes the read failure; retry only these reads.
		} finally {
			loading = false;
		}
	}
	const available = $derived(
		sameAccount &&
			$personalAuctions.loaded &&
			!$personalAuctions.error &&
			!existing &&
			!card.userProtected &&
			!card.pendingTradeId &&
			!card.activeSale &&
			!card.saleId &&
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
	async function prepare() {
		if (busy) return;
		error = '';
		if (!valid()) {
			error = $_('auctionHub.periodError');
			return;
		}
		busy = true;
		try {
			quote = await getAuctionFee(price!);
			confirm = true;
		} catch (cause) {
			error = $_(auctionErrorKey(cause));
		} finally {
			busy = false;
		}
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
				...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
				endsAt: new Date(endsAt).toISOString()
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
	{:else}<p class="text-sm text-muted-foreground" role="status">
			{$_(
				sameAccount && $personalAuctions.error && !loading
					? 'auctionHub.personalError'
					: !sameAccount || !$personalAuctions.loaded || loading
						? 'auctionHub.loading'
						: 'market.auction_card_locked'
			)}
		</p>
		{#if sameAccount && $personalAuctions.error && userId}
			<Button variant="outline" disabled={loading} onclick={() => userId && loadAuctions(userId)}
				>{$_('auctionHub.retry')}</Button
			>
		{/if}
	{/if}
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
		$_('auctionHub.fee', { values: { amount: quote?.due ?? 0 } }) +
		' ' +
		$_('auctionHub.settlementFee')}
	onConfirm={() => void submit()}
/>
