<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import { placeBid } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let showPrices = $state(false);
	let bidAmount = $state(0);
	let favoriteIds = $state<string[]>([]);

	function minimumBid(currentBid: number) {
		return Math.ceil(currentBid * 1.1);
	}

	function updateBid(value: string, currentBid: number) {
		const minimum = minimumBid(currentBid);
		bidAmount = Math.max(minimum, Number(value) || minimum);
	}

	function toggleFavorite(id: string) {
		favoriteIds = favoriteIds.includes(id)
			? favoriteIds.filter((item) => item !== id)
			: [...favoriteIds, id];
		localStorage.setItem('market-favorites', JSON.stringify(favoriteIds));
	}

	async function submitBid(saleId: string, currentBid: number) {
		await placeBid(saleId, Math.max(bidAmount, minimumBid(currentBid)));
		location.reload();
	}
</script>

{#await Promise.all([data.sale, data.bids, data.cards])}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('market.loading')}</p>
{:then [sale, bids, cards]}
	{@const card = cards.items.find((item) => item.id === sale.cardId)}
	{#if card}<section class="flex flex-col gap-6 pb-12">
			<a href="/market" class="font-mono text-[10px] uppercase tracking-widest text-primary"
				>← {$_('market.back')}</a
			>
			<div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
				<CardTile {card} showFriendOwners={false} />
				<div class="min-w-0">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h1 class="font-serif text-4xl font-black uppercase tracking-tight">{card.title}</h1>
							<p class="mt-2 font-serif italic text-muted-foreground">
								{$_('market.sold_by')} @{sale.sellerName}
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<Button
								size="icon-sm"
								variant="outline"
								aria-label={$_('market.price_history')}
								onclick={() => (showPrices = true)}>↗</Button
							><Button
								size="sm"
								variant={favoriteIds.includes(sale.id) ? 'default' : 'outline'}
								onclick={() => toggleFavorite(sale.id)}
								>{favoriteIds.includes(sale.id) ? '♥' : '♡'} {$_('market.favorite')}</Button
							>
						</div>
					</div>
					<section class="mt-6 border-4 border-double border-primary/30 bg-card p-4">
						<p class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
							{$_('market.current_bid')}
						</p>
						<p class="mt-2 font-mono text-3xl font-black text-primary">
							{sale.price}
							{sale.currency}
						</p>
						<p class="mt-3 font-serif text-sm">
							{$_('market.leading_bidder')}
							{bids[0]?.bidderName ?? $_('market.none')}
						</p>
					</section>
					<section class="mt-4 border border-primary/30 bg-card p-4">
						<div class="flex justify-between gap-3">
							<p class="font-serif text-sm">{$_('market.wallet')} <strong>33 714</strong></p>
							<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
								{$_('market.minimum_bid')}
								{minimumBid(sale.price)}
							</p>
						</div>
						<div class="mt-3 flex gap-2">
							<Input
								value={bidAmount || minimumBid(sale.price)}
								type="number"
								min={minimumBid(sale.price)}
								placeholder={$_('market.bid_amount')}
								oninput={(event) => updateBid(event.currentTarget.value, sale.price)}
							/><Button
								disabled={bidAmount < minimumBid(sale.price)}
								onclick={() => void submitBid(sale.id, sale.price)}>{$_('market.bid')}</Button
							>
						</div>
					</section>
				</div>
			</div>
			<section>
				<h2 class="font-serif text-xl font-black uppercase">
					{$_('market.bid_history', { values: { count: bids.length } })}
				</h2>
				<div class="mt-3 divide-y divide-primary/15 border border-primary/30 bg-card">
					{#each bids as bid (bid.id)}<div class="flex items-center justify-between gap-4 p-3">
							<span class="font-serif font-bold">{bid.bidderName}</span><span
								class="font-mono text-xs text-primary">{bid.amount} {sale.currency}</span
							>
						</div>{/each}
				</div>
			</section>
			{#if showPrices}<section class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
					<div class="w-full max-w-2xl border-4 border-double border-primary/40 bg-card p-5">
						<div class="flex justify-between gap-3">
							<div>
								<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
									{$_('market.price_history')}
								</p>
								<h2 class="mt-2 font-serif text-2xl font-black uppercase">{card.title}</h2>
							</div>
							<Button size="sm" variant="outline" onclick={() => (showPrices = false)}
								>{$_('cardDetail.close')}</Button
							>
						</div>
						<div class="mt-5 grid grid-cols-3 gap-2">
							{#each ['last', 'average', 'high'] as metric}<div
									class="border border-primary/30 p-3"
								>
									<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
										{$_(`market.metric_${metric}`)}
									</p>
									<p class="mt-2 font-mono text-lg text-primary">
										{metric === 'last'
											? sale.price
											: metric === 'average'
												? Math.round((sale.price + 39) / 2)
												: sale.price + 25}
									</p>
								</div>{/each}
						</div>
						<div class="mt-5 h-36 border border-primary/20 bg-background p-4">
							<div class="h-full border-b-2 border-l-2 border-primary/30">
								<div
									class="h-full w-full bg-[linear-gradient(160deg,transparent_46%,rgb(var(--primary))_47%,transparent_49%)] opacity-60"
								></div>
							</div>
						</div>
					</div>
				</section>{/if}
		</section>{/if}
{:catch}<p class="border border-destructive/40 p-4 font-serif text-destructive">
		{$_('market.empty')}
	</p>
{/await}
