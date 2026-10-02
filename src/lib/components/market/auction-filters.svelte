<script lang="ts">
	import { untrack, onDestroy } from 'svelte';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import { getWikiForgePublicPage } from '$lib/api/pages';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import VariantSelector from '$lib/components/cards/variant-selector.svelte';
	import type { MarketQuery } from '$lib/auctions/presentation';
	let {
		query,
		onChange
	}: { query: MarketQuery; onChange: (patch: Record<string, string>) => void } = $props();
	let articleTitle = $state('');
	let search = $state(''),
		budget = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let selected = $state<number[]>([]);
	$effect(() => {
		search = query.q;
		budget = query.max;
		selected = query.variant.split(',').filter(Boolean).map(Number);
	});
	$effect(() => {
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
						.catch(() => undefined)
			);
		return () => {
			alive = false;
		};
	});
	onDestroy(() => clearTimeout(timer));
	const active = $derived(
		Number(Boolean(query.q || query.max || query.variant || query.pageId || query.wishlist)) +
			Number(Boolean(query.phase)) +
			Number(Boolean(query.min)) +
			Number(query.sortBy !== 'ENDS_AT') +
			Number(query.sortDirection !== 'ASC')
	);
	function applySearch() {
		clearTimeout(timer);
		timer = setTimeout(() => onChange({ q: search, max: budget, page: '0' }), 400);
	}
</script>

<div class="grid gap-2">
	<div class="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
		<Input
			type="search"
			maxlength={50}
			bind:value={search}
			aria-label={$_('auctionHub.search')}
			placeholder={$_('auctionHub.search')}
			oninput={applySearch}
		/><Input
			type="number"
			min={0}
			max={1000000000000}
			bind:value={budget}
			aria-label={$_('auctionHub.maximum')}
			placeholder={$_('arcade.budget')}
			oninput={applySearch}
		/>
	</div>
	<div class="flex min-w-0 items-end gap-2 overflow-x-auto py-1 [&>*]:shrink-0">
		<Button
			variant={query.wishlist ? 'default' : 'outline'}
			aria-pressed={Boolean(query.wishlist)}
			onclick={() =>
				onChange({ wishlist: query.wishlist ? '' : ($currentSession?.user.id ?? ''), page: '0' })}
			>{$_('plan.auctions.wanted')}</Button
		>
		<VariantSelector
			bind:selected
			compact
			onChange={() => onChange({ variant: selected.join(','), page: '0' })}
		/>

		<label class="grid gap-1 text-sm"
			>{$_('auctionHub.minimum')}<Input
				type="number"
				min={0}
				value={query.min}
				onchange={(event) => onChange({ min: event.currentTarget.value, page: '0' })}
			/></label
		>
		<label class="grid gap-1 text-sm"
			>{$_('auctionHub.phaseLabel')}<select
				class="min-h-11"
				value={query.phase}
				onchange={(event) => onChange({ phase: event.currentTarget.value, page: '0' })}
				><option value="">{$_('auctionHub.all')}</option
				>{#each ['RUNNING', 'UPCOMING'] as phase (phase)}<option value={phase}
						>{$_('apiEvolution.phase.' + phase)}</option
					>{/each}</select
			></label
		>
		<label class="grid gap-1 text-sm"
			>{$_('apiEvolution.sortBy')}<select
				class="min-h-11"
				value={query.sortBy}
				onchange={(event) => onChange({ sortBy: event.currentTarget.value, page: '0' })}
				>{#each ['ENDS_AT', 'PRICE', 'CREATION_DATE'] as sort (sort)}<option value={sort}
						>{$_('apiEvolution.sort.' + sort)}</option
					>{/each}</select
			></label
		>
		<label class="grid gap-1 text-sm"
			>{$_('apiEvolution.sortDirection')}<select
				class="min-h-11"
				value={query.sortDirection}
				onchange={(event) => onChange({ sortDirection: event.currentTarget.value, page: '0' })}
				><option value="ASC">{$_('apiEvolution.ascending')}</option><option value="DESC"
					>{$_('apiEvolution.descending')}</option
				></select
			></label
		>
		{#if active}
			<Button
				variant="ghost"
				onclick={() =>
					onChange({
						q: '',
						variant: '',
						min: '',
						max: '',
						phase: '',
						pageId: '',
						wishlist: '',
						sortBy: '',
						sortDirection: '',
						page: '0'
					})}>{$_('auctionHub.reset')}</Button
			>{/if}
	</div>
	{#if query.pageId}<div class="flex flex-wrap items-center gap-2 text-sm">
			<span>{articleTitle || $_('completion.loading')}</span><Button
				variant="ghost"
				onclick={() => onChange({ pageId: '', title: '', page: '0' })}
				>{$_('plan.auctions.removeExact')}</Button
			>
		</div>{/if}
</div>
