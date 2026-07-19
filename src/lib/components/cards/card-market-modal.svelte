<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getCardPriceHistory, getMarketListings } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Dialog } from 'bits-ui';
	import CardPriceChart from './card-price-chart.svelte';
	import { _ } from '$lib/i18n';
	import XIcon from '@lucide/svelte/icons/x';
	import type { CardPriceHistory, CardRecord, SaleListing } from '$lib/types';
	import { createModalLayer } from '$lib/components/ui/dialog/modal-layer';

	let {
		card,
		history,
		sales,
		onClose
	}: {
		card: CardRecord;
		history?: CardPriceHistory;
		sales?: SaleListing[];
		onClose: () => void;
	} = $props();
	const layer = createModalLayer();

	const initialData = untrack(() => {
		const cardId = card.catalogueId ?? card.id;
		return {
			history: history ?? { cardId, points: [] },
			sales: sales ?? [],
			loading: !history || !sales
		};
	});
	const cardId = $derived(card.catalogueId ?? card.id);
	let loadedHistory = $state<CardPriceHistory>(initialData.history);
	let loadedSales = $state<SaleListing[]>(initialData.sales);
	let loading = $state(initialData.loading);
	let failed = $state(false);
	const prices = $derived(loadedHistory.points.map((point) => point.price));
	const lastPrice = $derived(prices.at(-1) ?? loadedSales[0]?.price ?? 0);
	const averagePrice = $derived(
		prices.length ? prices.reduce((total, price) => total + price, 0) / prices.length : lastPrice
	);
	const maximumPrice = $derived(prices.length ? Math.max(...prices) : lastPrice);

	onMount(async () => {
		if (history && sales) return;
		loading = true;
		try {
			const [nextHistory, nextSales] = await Promise.all([
				history ? Promise.resolve(history) : getCardPriceHistory(cardId),
				sales ? Promise.resolve(sales) : getMarketListings({ query: card.title })
			]);
			loadedHistory = nextHistory;
			loadedSales = nextSales.filter(
				(sale) =>
					sale.cardId === cardId || sale.card?.id === cardId || sale.card?.catalogueId === cardId
			);
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});
</script>

<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/80 backdrop-blur-md" style={`z-index:${layer}`} />
		<Dialog.Content
			preventScroll={false}
			class="fixed top-1/2 left-1/2 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-primary/45 bg-card text-foreground shadow-2xl outline-none sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)]"
			style={`z-index:${layer + 1}`}
			data-testid="card-market-modal"
		>
			<header
				class="flex shrink-0 items-start justify-between gap-3 border-b border-primary/25 p-3 sm:p-4"
			>
				<div class="min-w-0">
					<p class="forge-label">{$_('market.price_history')}</p>
					<Dialog.Title class="mt-1 truncate font-serif text-2xl font-bold sm:text-3xl">
						{card.title}
					</Dialog.Title>
				</div>
				<Button size="icon" variant="outline" onclick={onClose} aria-label={$_('cardDetail.close')}>
					<XIcon />
				</Button>
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
				{#if loading}
					<div class="grid min-h-80 place-items-center font-mono text-xs uppercase text-primary">
						{$_('market.loading')}
					</div>
				{:else if failed}
					<p class="border border-destructive/40 p-4 text-destructive">
						{$_('market.price_history_error')}
					</p>
				{:else}
					<div class="grid grid-cols-3 gap-2">
						{#each [['last', lastPrice], ['average', averagePrice], ['high', maximumPrice]] as metric (metric[0])}
							<div class="border border-primary/25 bg-background/60 p-2 sm:p-3">
								<p
									class="font-mono text-[8px] uppercase tracking-widest text-muted-foreground sm:text-[9px]"
								>
									{$_(`market.metric_${metric[0]}`)}
								</p>
								<p class="mt-1 truncate font-mono text-base text-primary sm:text-xl">
									{Number(metric[1]).toFixed(2)}
								</p>
							</div>
						{/each}
					</div>

					<div class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
						<CardPriceChart points={loadedHistory.points} />
						<aside class="border border-primary/25 bg-background/50 p-3">
							<p class="forge-label">{$_('cardDetail.market_summary')}</p>
							{#if loadedSales.length}
								<ul class="mt-2 divide-y divide-primary/15">
									{#each loadedSales.slice(0, 6) as sale (sale.id)}
										<li class="flex justify-between gap-2 py-2 text-xs">
											<span
												>{sale.type === 'auction'
													? $_('market.auction')
													: $_('market.direct_sale')}</span
											>
											<strong class="font-mono text-primary">{sale.price} {sale.currency}</strong>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="mt-2 text-sm text-muted-foreground">{$_('cardDetail.no_sales')}</p>
							{/if}
						</aside>
					</div>
				{/if}
			</div>

			<footer class="flex shrink-0 justify-end border-t border-primary/25 p-3">
				<Button onclick={() => goto(resolve('/market'))}>{$_('cardDetail.market')}</Button>
			</footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
