<script lang="ts">
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';

	import { currentSession } from '$lib/auth/session';
	import { getWikiForgePublicPage } from '$lib/api/pages';
	import { untrack } from 'svelte';
	import { _ } from '$lib/i18n';

	import { Button } from '$lib/components/ui/button';

	import type { MarketQuery } from '$lib/auctions/presentation';

	import { onMount } from 'svelte';
	import { getVariants } from '$lib/api/variants';
	import type { Auction } from '$lib/types';

	let {
		query,

		items,

		onChange
	}: { query: MarketQuery; items: Auction[]; onChange: (patch: Record<string, string>) => void } =
		$props();

	let expanded = $state(false);
	let wanted = $state(false);
	let articleTitle = $state('');
	$effect(() => {
		wanted = Boolean(query.wishlist);
		const id = query.pageId;
		articleTitle = '';
		let alive = true;
		if (id)
			untrack(
				() =>
					void getWikiForgePublicPage(Number(id))
						.then((page) => {
							if (alive) articleTitle = page.title;
						})
						.catch(() => {
							if (alive) articleTitle = $_('plan.auctions.exactCard');
						})
			);
		return () => {
			alive = false;
		};
	});

	let selectedVariants = $derived(query.variant.split(',').filter(Boolean).map(Number));
	let variants = $state<Auction['card']['variant'][]>([]);
	onMount(() => {
		void getVariants()
			.then((value) => {
				variants = value;
			})
			.catch(() => {
				variants = items.map((item) => item.card.variant);
			});
	});

	const active = $derived(
		[
			query.q,
			query.variant,

			query.min,
			query.max,
			query.phase,

			query.sortBy === 'ENDS_AT' ? '' : query.sortBy,
			query.sortDirection === 'ASC' ? '' : query.sortDirection
		].filter(Boolean)
	);

	function submit(event: SubmitEvent) {
		event.preventDefault();

		const fields = new FormData(event.currentTarget as HTMLFormElement);

		fields.set('variant', selectedVariants.join(','));
		fields.set('page', '0');
		fields.set('wishlist', wanted ? ($currentSession?.user.id ?? '') : '');

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

	{#if query.pageId}<div class="mb-3 flex flex-wrap items-center gap-2">
			<span>{articleTitle || $_('completion.loading')}</span><Button
				size="sm"
				variant="ghost"
				onclick={() => onChange({ pageId: '', title: '', page: '0' })}
				>{$_('plan.auctions.removeExact')}</Button
			>
		</div>{/if}
	<form class="flex flex-col gap-3" onsubmit={submit} aria-label={$_('auctionHub.filters')}>
		<div>
			<h2 class="font-serif text-xl">{$_('auctionHub.filters')}</h2>

			<p class="mt-1 text-xs text-muted-foreground">{$_('auctionHub.filterScope')}</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.search')}<input
					name="q"
					maxlength="50"
					value={query.q}
					type="search"
					class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				/></label
			>

			<label class="grid gap-1 text-sm"
				>{$_('auctionHub.variant')}<VariantSelector
					options={variants}
					bind:selected={selectedVariants}
					multiple={true}
					name="variant"
					onChange={() => {}}
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
					>{#each ['RUNNING', 'UPCOMING'] as phase (phase)}<option value={phase}
							>{$_('apiEvolution.phase.' + phase)}</option
						>{/each}</select
				></label
			>
			<label class="flex items-center gap-2 text-sm"
				><input type="checkbox" bind:checked={wanted} />{$_('plan.auctions.wanted')}</label
			>
			<label class="grid gap-1 text-sm"
				>{$_('apiEvolution.sortBy')}<select
					name="sortBy"
					value={query.sortBy}
					class="h-11 border border-primary/25 bg-background px-3"
					>{#each ['ENDS_AT', 'PRICE', 'CREATION_DATE'] as sort (sort)}<option value={sort}
							>{$_('apiEvolution.sort.' + sort)}</option
						>{/each}</select
				></label
			>
			<label class="grid gap-1 text-sm"
				>{$_('apiEvolution.sortDirection')}<select
					name="sortDirection"
					value={query.sortDirection}
					class="h-11 border border-primary/25 bg-background px-3"
					><option value="ASC">{$_('apiEvolution.ascending')}</option><option value="DESC"
						>{$_('apiEvolution.descending')}</option
					></select
				></label
			>
		</div>

		<div class="flex flex-wrap gap-2">
			<Button type="submit">{$_('auctionHub.applyFilters')}</Button><Button
				variant="ghost"
				onclick={() =>
					onChange({
						q: '',
						variant: '',
						seller: '',
						min: '',
						max: '',
						phase: '',
						pageId: '',
						wishlist: '',
						sortBy: '',
						sortDirection: '',
						page: '0'
					})}>{$_('auctionHub.reset')}</Button
			>
		</div>
	</form>
</details>
