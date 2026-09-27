<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { Auction } from '$lib/types';
	import { updateAuction, cancelMyAuction } from '$lib/api/auctions';
	import { ApiError } from '$lib/api/client';
	import { auctionErrorKey } from '$lib/auctions/errors';
	import { canEditAuction, validAmount } from '$lib/auctions/presentation';
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
	let price = $state<number | undefined>();
	let busy = $state(false);
	let error = $state('');
	let confirm = $state(false);
	let action = $state<'price' | 'cancel'>('price');
	const editable = $derived(canEditAuction(auction, now));
	async function submit() {
		if (busy || !editable || (action === 'price' && (!price || !validAmount(price)))) {
			confirm = false;
			return;
		}
		busy = true;
		error = '';
		try {
			if (action === 'price') onUpdated(await updateAuction(auction.id, price!));
			else {
				await cancelMyAuction(auction.id);
				onUpdated({ ...auction, status: 'CANCELLED', closedAt: new Date().toISOString() });
			}
			toast.success($_(action === 'price' ? 'market.auction_saved' : 'market.auction_cancelled'));
		} catch (cause) {
			if (cause instanceof ApiError && cause.status === 409) await onConflict();
			error = $_(auctionErrorKey(cause));
		} finally {
			busy = false;
			confirm = false;
		}
	}
</script>

<section class="forge-panel space-y-4 p-4 sm:p-5">
	<h2 class="font-serif text-xl">{$_('auctionHub.manage')}</h2>
	{#if editable}
		<label class="grid gap-2 text-sm"
			>{$_('auctionHub.editPrice')}
			<input
				type="number"
				min="1"
				max="1000000000000"
				step="1"
				bind:value={price}
				placeholder={String(auction.startPrice)}
				class="h-11 min-w-0 border border-primary/30 bg-background px-3"
			/>
		</label>
		<p class="text-sm text-muted-foreground">{$_('auctionHub.editFee')}</p>
		<div class="flex flex-wrap gap-2">
			<Button
				disabled={busy || !price || !validAmount(price) || price === auction.startPrice}
				onclick={() => {
					action = 'price';
					confirm = true;
				}}>{$_('auctionHub.save')}</Button
			>
			<Button
				variant="destructive"
				disabled={busy}
				onclick={() => {
					action = 'cancel';
					confirm = true;
				}}>{$_('auctionHub.cancelAuction')}</Button
			>
		</div>
	{:else}<p class="text-sm text-muted-foreground">{$_('auctionHub.locked')}</p>{/if}
	{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
</section>
<AuctionConfirmation
	bind:open={confirm}
	{busy}
	title={$_(action === 'price' ? 'auctionHub.editConfirm' : 'auctionHub.cancelConfirm')}
	description={action === 'price'
		? $_('auctionHub.startPrice') + ' : ' + price + '. ' + $_('auctionHub.editFee')
		: $_('auctionHub.cancelHelp')}
	onConfirm={() => void submit()}
/>
