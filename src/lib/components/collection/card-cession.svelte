<script lang="ts">
	import { activeAuctionCardIds } from '$lib/auctions/store';
	import { _ } from '$lib/i18n';
	import type { CardRecord } from '$lib/types';
	import { createInstantSale } from '$lib/api/player-profile';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import { operationError } from '$lib/domain/operation-error';
	import { activeRestrictions } from '$lib/moderation/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import AuctionCreatePanel from '$lib/components/market/auction-create-panel.svelte';
	let { card, onChanged }: { card: CardRecord; onChanged?: () => void } = $props();
	let mode = $state<'sale' | 'auction'>('sale');
	let price = $state<number>();
	let busy = $state(false);
	let error = $state('');
	let success = $state(false);
	const available = $derived(
		!card.userProtected &&
			!card.saleId &&
			!card.activeSale &&
			!card.activeAuctionId &&
			!$activeAuctionCardIds.has(card.id) &&
			!$activeRestrictions.includes('TRADE')
	);
	async function sell(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !available || !price || !Number.isSafeInteger(price) || price > 1e12) return;
		busy = true;
		error = '';
		try {
			await createInstantSale(card.id, price);
			success = true;
			publishRealtimeRefresh(['collection', 'profile']);
			onChanged?.();
		} catch (cause) {
			error = operationError(cause);
		} finally {
			busy = false;
		}
	}
</script>

<section class="mt-4 space-y-3 border-t border-primary/20 pt-4">
	<h3 class="font-semibold">{$_('plan.cards.cede')}</h3>
	<div class="flex flex-wrap gap-2">
		<Button
			size="sm"
			variant={mode === 'sale' ? 'default' : 'outline'}
			onclick={() => (mode = 'sale')}>{$_('plan.cards.instantSale')}</Button
		><Button
			size="sm"
			variant={mode === 'auction' ? 'default' : 'outline'}
			onclick={() => (mode = 'auction')}>{$_('plan.cards.auction')}</Button
		>
	</div>
	{#if mode === 'auction'}<AuctionCreatePanel {card} />{:else if success}<p role="status">
			{$_('plan.cards.saleCreated')}
		</p>
		<Button variant="outline" href="/profile">{$_('plan.cards.manageSales')}</Button
		>{:else if !available}<p class="text-sm text-muted-foreground">
			{$_('plan.cards.unavailableSale')}
		</p>{:else}<form class="space-y-3" onsubmit={sell}>
			<p class="text-sm text-muted-foreground">{$_('plan.cards.saleInfo')}</p>
			<label class="block space-y-1"
				><span>{$_('profile.sale_price')}</span><Input
					type="number"
					min={1}
					max={1e12}
					step={1}
					bind:value={price}
					required
					disabled={busy}
				/></label
			>{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}<Button
				type="submit"
				disabled={busy || !price || !Number.isSafeInteger(price)}
				>{$_('profile.create_instant_sale')}</Button
			>
		</form>{/if}
</section>
