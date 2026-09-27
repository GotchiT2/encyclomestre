<script lang="ts">
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';

	import { _ } from '$lib/i18n';

	import { Button } from '$lib/components/ui/button';

	import type { MarketQuery } from '$lib/auctions/presentation';

	import type { Auction } from '$lib/types';

	let {
		query,

		items,

		onChange
	}: { query: MarketQuery; items: Auction[]; onChange: (patch: Record<string, string>) => void } =
		$props();

	let expanded = $state(false);

	let selectedVariants = $derived(query.variant ? [Number(query.variant)] : []);
	const variants = $derived([
		...new Map(items.map((item) => [item.card.variantId, item.card.variant])).values()
	]);

	const active = $derived(
		[query.q, query.variant, query.seller, query.min, query.max, query.phase].filter(Boolean)
	);

	function submit(event: SubmitEvent) {
		event.preventDefault();

		const fields = new FormData(event.currentTarget as HTMLFormElement);

		fields.set('variant', String(selectedVariants[0] ?? ''));

		onChange(Object.fromEntries([...fields].map(([key, value]) => [key, String(value)])));
	}
</script>

<details class="forge-panel p-3" bind:open={expanded}>
	<summary class="min-h-11 cursor-pointer content-center font-bold"
		>{$_('auctionHub.filters')} · {$_('ux.filtersSummary', {
			values: { count: active.length }
		})}</summary
	>

	{#if active.length}<p class="mb-2 break-words text-xs text-muted-foreground">
			{active
				.map((value) => variants.find((v) => String(v.id) === value)?.name ?? value)
				.join(' · ')}
		</p>{/if}

	<form class="flex flex-col gap-3" onsubmit={submit} aria-label={$_('auctionHub.filters')}>
		<div>
			<h2 class="font-serif text-xl">{$_('auctionHub.filters')}</h2>

			<p class="mt-1 text-xs text-muted-foreground">{$_('auctionHub.filterScope')}</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.search')}<input
					name="q"
					value={query.q}
					type="search"
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				/></label
			>

			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.variant')}<VariantSelector
					options={variants}
					bind:selected={selectedVariants}
					multiple={false}
					name="variant"
					onChange={() => {}}
				/></label
			>

			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.seller')}<input
					name="seller"
					value={query.seller}
					type="search"
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				/></label
			>

			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.minimum')}<input
					name="min"
					value={query.min}
					type="number"
					min="0"
					max="1000000000000"
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				/></label
			>

			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.maximum')}<input
					name="max"
					value={query.max}
					type="number"
					min="0"
					max="1000000000000"
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				/></label
			>

			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.phaseLabel')}<select
					name="phase"
					value={query.phase}
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
					><option value="">{$_('auctionHub.all')}</option
					>{#each ['open', 'upcoming', 'settling'] as phase (phase)}<option value={phase}
							>{$_('auctionHub.phase.' + phase)}</option
						>{/each}</select
				></label
			>
		</div>

		<div class="flex flex-wrap gap-2">
			<Button type="submit">{$_('auctionHub.applyFilters')}</Button><Button
				variant="ghost"
				onclick={() => onChange({ q: '', variant: '', seller: '', min: '', max: '', phase: '' })}
				>{$_('auctionHub.reset')}</Button
			>
		</div>
	</form>
</details>
