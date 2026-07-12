<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardPriceHistory, SaleListing } from '$lib/types';
	let {
		sales,
		history,
		onMarket
	}: { sales: SaleListing[]; history: CardPriceHistory; onMarket: () => void } = $props();
</script>

<section class="border-4 border-double border-primary/30 bg-card p-4">
	<div class="flex items-center justify-between gap-3">
		<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('cardDetail.market_summary')}
		</p>
		<Button size="xs" variant="outline" onclick={onMarket}>{$_('cardDetail.market')}</Button>
	</div>
	{#if sales.length}<ul class="mt-3 divide-y divide-primary/10 border-y border-primary/10">
			{#each sales as sale (sale.id)}<li
					class="flex justify-between gap-3 py-2 font-mono text-[10px] uppercase tracking-widest"
				>
					<span
						>{sale.type === 'auction'
							? $_('cardDetail.auction')
							: $_('cardDetail.direct_sale')}</span
					><span style="color:var(--primary)">{sale.price.toFixed(2)} {sale.currency}</span>
				</li>{/each}
		</ul>{:else}<p class="mt-3 font-serif text-sm italic text-muted-foreground">
			{$_('cardDetail.no_sales')}
		</p>{/if}
	<p class="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
		{$_('codex.priceHistory')}
	</p>
	<ul class="mt-2 divide-y divide-primary/10 border-y border-primary/10">
		{#each history.points.slice(-3) as point (point.date)}<li
				class="flex justify-between gap-3 py-2 font-mono text-[10px] uppercase tracking-widest"
			>
				<span>{new Date(point.date).toLocaleDateString('fr-FR')}</span><span class="text-primary"
					>{point.price.toFixed(2)} {point.currency}</span
				>
			</li>{/each}
	</ul>
</section>
