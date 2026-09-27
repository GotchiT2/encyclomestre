<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import {
		auctionTabs,
		auctionPhase,
		filterAuctions,
		historyKind,
		type MarketQuery
	} from '$lib/auctions/presentation';
	import type { AuctionPage } from '$lib/types';
	import { personalAuctions, auctionEscrowed } from '$lib/auctions/store';
	import AuctionFilters from './auction-filters.svelte';
	import AuctionCardList from './auction-card-list.svelte';
	let {
		query,
		catalogue,
		userId,
		busy,
		error,
		now,
		from,
		onChange,
		onRefresh
	}: {
		query: MarketQuery;
		catalogue: AuctionPage;
		userId?: string;
		busy: boolean;
		error: string;
		now: number;
		from: string;
		onChange: (patch: Record<string, string>) => void;
		onRefresh: () => void;
	} = $props();
	const personal = $derived(
		$personalAuctions.userId === userId
			? $personalAuctions
			: { sales: [], bids: [], loaded: false, error: false }
	);
	const sales = $derived(personal.sales.filter((item) => item.status === 'OPEN'));
	const bids = $derived(personal.bids.filter((item) => item.status === 'OPEN'));
	const history = $derived(
		[
			...new Map([...personal.bids, ...personal.sales].map((item) => [item.id, item])).values()
		].filter((item) => item.status !== 'OPEN')
	);
	const filtered = $derived(filterAuctions(catalogue.results, query, now));
	const pageCount = $derived(Math.max(1, Math.ceil(catalogue.nbResults / 48)));
</script>

<main class="w-full min-w-0 space-y-5">
	<header class="forge-panel space-y-4 p-5 sm:p-7">
		<p class="forge-label">{$_('auctionHub.eyebrow')}</p>
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="font-serif text-3xl sm:text-4xl">{$_('auctionHub.title')}</h1>
				<p class="mt-2 max-w-2xl text-sm text-muted-foreground">{$_('auctionHub.intro')}</p>
			</div>
			<Button variant="outline" disabled={busy} onclick={onRefresh}
				>{$_(busy ? 'auctionHub.refreshing' : 'auctionHub.refresh')}</Button
			>
		</div>
		{#if userId}<div class="flex flex-wrap gap-x-6 gap-y-2 border-t border-primary/15 pt-3 text-sm">
				<p>
					{$_('auctionHub.escrow')} :
					<strong class="text-primary">{$auctionEscrowed.toLocaleString('fr')} ◈</strong>
				</p>
				<p>{$_('auctionHub.slots', { values: { count: Math.max(0, 3 - sales.length) } })}</p>
			</div>{/if}
	</header>
	<nav class="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={$_('auctionHub.title')}>
		{#each auctionTabs as tab (tab)}
			<Button
				variant="outline"
				class={query.tab === tab ? 'forge-nav-active border-primary' : ''}
				aria-current={query.tab === tab ? 'page' : undefined}
				onclick={() => onChange({ tab, page: '0' })}>{$_('auctionHub.tabs.' + tab)}</Button
			>
		{/each}
	</nav>
	{#if error || (query.tab !== 'explore' && personal.error)}<div
			role="alert"
			class="forge-panel p-4 text-sm"
		>
			<p>{$_(error || 'auctionHub.personalError')}</p>
			<Button variant="outline" class="mt-3" disabled={busy} onclick={onRefresh}
				>{$_('auctionHub.retry')}</Button
			>
		</div>{/if}
	{#if query.tab === 'explore'}
		<AuctionFilters {query} items={catalogue.results} {onChange} />
		<p class="text-xs text-muted-foreground">
			{$_('auctionHub.visibleResults', {
				values: { visible: filtered.length, loaded: catalogue.results.length }
			})}
		</p>
		{#if busy && !catalogue.results.length}<p
				aria-busy="true"
				class="forge-panel min-h-48 animate-pulse p-6"
			>
				{$_('auctionHub.loading')}
			</p>{:else}<AuctionCardList items={filtered} {from} {now} {userId} />{/if}
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-sm">
				{$_('auctionHub.page', { values: { page: query.page + 1, total: pageCount } })}
			</p>
			<div class="flex gap-2">
				<Button
					variant="outline"
					disabled={busy || query.page === 0}
					onclick={() => onChange({ page: String(query.page - 1) })}>{$_('codex.previous')}</Button
				><Button
					variant="outline"
					disabled={busy || query.page + 1 >= pageCount}
					onclick={() => onChange({ page: String(query.page + 1) })}>{$_('codex.next')}</Button
				>
			</div>
		</div>
	{:else if !personal.loaded && !personal.error}
		<p aria-busy="true" class="forge-panel min-h-48 animate-pulse p-6">
			{$_('auctionHub.loading')}
		</p>
	{:else if query.tab === 'sales'}
		<section class="forge-panel flex flex-wrap items-center justify-between gap-4 p-5">
			<p class="text-sm text-muted-foreground">{$_('auctionHub.chooseCard')}</p>
			<Button href="/collection">{$_('auctionHub.create')}</Button>
		</section>
		{#each ['open', 'upcoming', 'settling'] as phase (phase)}<section class="space-y-3">
				<h2 class="font-serif text-xl">{$_('auctionHub.phase.' + phase)}</h2>
				<AuctionCardList
					items={sales.filter((item) => auctionPhase(item, now) === phase)}
					{from}
					{now}
					{userId}
				/>
			</section>{/each}
	{:else if query.tab === 'bids'}
		{#each [true, false] as leading (String(leading))}<section class="space-y-3">
				<h2 class="font-serif text-xl">
					{$_(leading ? 'auctionHub.leading' : 'auctionHub.outbid')}
				</h2>
				<AuctionCardList
					items={bids.filter((item) => item.leading === leading)}
					{from}
					{now}
					{userId}
				/>
			</section>{/each}
	{:else}
		<p class="forge-panel-flat p-4 text-sm text-muted-foreground">{$_('auctionHub.historyHelp')}</p>
		<label class="grid max-w-sm gap-2 text-sm"
			>{$_('auctionHub.phaseLabel')}<select
				class="h-11 min-w-0 border border-primary/25 bg-background px-3"
				value={query.history}
				onchange={(event) => onChange({ history: event.currentTarget.value })}
				><option value="">{$_('auctionHub.all')}</option
				>{#each ['won', 'sold', 'unsold', 'cancelled', 'lost', 'unknown'] as kind (kind)}<option
						value={kind}>{$_('auctionHub.historyKind.' + kind)}</option
					>{/each}</select
			></label
		>
		{#each ['won', 'sold', 'unsold', 'cancelled', 'lost', 'unknown'] as kind (kind)}
			{#if !query.history || query.history === kind}<section class="space-y-3">
					<h2 class="font-serif text-xl">{$_('auctionHub.historyKind.' + kind)}</h2>
					<AuctionCardList
						items={history.filter((item) => historyKind(item, userId ?? '') === kind)}
						{from}
						{now}
						{userId}
					/>
				</section>{/if}
		{/each}
	{/if}
</main>
