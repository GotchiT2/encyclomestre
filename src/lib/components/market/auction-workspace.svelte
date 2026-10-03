<script lang="ts">
	import MarketNavigation from './market-navigation.svelte';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw } from '@lucide/svelte';
	import {
		auctionTabs,
		auctionPhase,
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
	const sales = $derived(catalogue.results.filter((item) => item.status === 'OPEN'));
	const bids = $derived(catalogue.results.filter((item) => item.status === 'OPEN'));
	const history = $derived(catalogue.results);
	const filtered = $derived(catalogue.results);
	const pageCount = $derived(
		Math.max(1, Math.ceil(catalogue.nbResults / (catalogue.pageSize ?? 48)))
	);
</script>

<MarketNavigation />
<main class="w-full min-w-0 space-y-5">
	<header class="space-y-3 border-b border-border pb-4">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="font-heading text-3xl sm:text-4xl">{$_('auctionHub.title')}</h1>
			</div>
			<Button
				variant="outline"
				size="icon"
				aria-label={$_(busy ? 'auctionHub.refreshing' : 'auctionHub.refresh')}
				disabled={busy}
				onclick={onRefresh}><RefreshCw size={16} /></Button
			>
		</div>
		{#if userId}<div class="flex flex-wrap gap-x-6 gap-y-2 border-t border-primary/15 pt-3 text-sm">
				<p>
					{$_('auctionHub.escrow')} :
					<strong class="text-primary">{$auctionEscrowed.toLocaleString('fr')} ◈</strong>
				</p>
				{#if personal.loaded}<p>
						{$_('auctionHub.slots', {
							values: {
								count: Math.max(
									0,
									3 - personal.sales.filter((item) => item.status === 'OPEN').length
								)
							}
						})}
					</p>{/if}
			</div>{/if}
	</header>
	<nav class="flex gap-2 overflow-x-auto pb-2" aria-label={$_('auctionHub.title')}>
		{#each auctionTabs as tab (tab)}
			<Button
				variant="outline"
				class={query.tab === tab ? 'forge-nav-active border-primary' : ''}
				aria-current={query.tab === tab ? 'page' : undefined}
				onclick={() => onChange({ tab, page: '0' })}>{$_('auctionHub.tabs.' + tab)}</Button
			>
		{/each}
	</nav>
	{#if error}<div role="alert" class="forge-panel p-4 text-sm">
			<p>{$_(error || 'auctionHub.personalError')}</p>
			<Button variant="outline" class="mt-3" disabled={busy} onclick={onRefresh}
				>{$_('auctionHub.retry')}</Button
			>
		</div>{/if}
	{#if query.tab === 'explore' || query.tab === 'favorites'}
		{#if query.tab === 'explore'}<AuctionFilters {query} {onChange} />{/if}
		<p class="text-xs text-muted-foreground">
			{$_('auctionHub.visibleResults', {
				values: { visible: filtered.length, loaded: catalogue.nbResults }
			})}
		</p>
		{#if busy && !catalogue.results.length}<p
				aria-busy="true"
				class="forge-panel min-h-48 animate-pulse p-6"
			>
				{$_('auctionHub.loading')}
			</p>{:else}<AuctionCardList items={filtered} {from} {now} {userId} />{/if}
	{:else if busy && !catalogue.results.length}
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
		<div class="flex flex-wrap gap-3">
			<label class="grid gap-2 text-sm"
				>{$_('apiEvolution.historySource')}<select
					class="h-11 border border-primary/25 bg-background px-3"
					value={query.source}
					onchange={(e) => onChange({ source: e.currentTarget.value, page: '0' })}
				>
					<option value="bids">{$_('auctionHub.tabs.bids')}</option><option value="sales"
						>{$_('auctionHub.tabs.sales')}</option
					>
				</select></label
			>
			<label class="grid gap-2 text-sm"
				>{$_('auctionHub.phaseLabel')}<select
					class="h-11 border border-primary/25 bg-background px-3"
					value={query.status}
					onchange={(e) => onChange({ status: e.currentTarget.value, page: '0' })}
				>
					<option value="">{$_('auctionHub.all')}</option
					>{#each ['OPEN', 'SOLD', 'UNSOLD', 'CANCELLED'] as status (status)}<option value={status}
							>{$_('apiEvolution.status.' + status)}</option
						>{/each}
				</select></label
			>
		</div>
		{#each ['won', 'sold', 'unsold', 'cancelled', 'lost', 'unknown'] as kind (kind)}
			{#if history.some((item) => historyKind(item, userId ?? '') === kind)}<section
					class="space-y-3"
				>
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
				disabled={busy || !(catalogue.hasNext ?? query.page + 1 < pageCount)}
				onclick={() => onChange({ page: String(query.page + 1) })}>{$_('codex.next')}</Button
			>
		</div>
	</div>
</main>
