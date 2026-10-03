<script lang="ts">
	import { realtimeRefresh, refreshIncludes } from '$lib/realtime/resource-refresh';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import { getAuctions, getMyAuctions, getMyBids, getAuctionFavorites } from '$lib/api/auctions';
	import { auctionEscrowed } from '$lib/auctions/store';
	import { marketQuery } from '$lib/auctions/presentation';
	import type { AuctionPage } from '$lib/types';
	import AuctionWorkspace from '$lib/components/market/auction-workspace.svelte';
	let catalogue = $state<AuctionPage>({ nbResults: 0, page: 0, results: [] });
	let busy = $state(false);
	let error = $state('');
	let now = $state(Date.now());
	let generation = 0;
	let revision = 0;
	$effect(() => {
		const update = $realtimeRefresh;
		if (update.revision === revision || !refreshIncludes(update, 'auctions')) return;
		revision = update.revision;
		untrack(() => void loadCatalogue(query.page));
	});
	let loadedScope = '';
	let abort: AbortController | undefined;
	const query = $derived(marketQuery(page.url.searchParams));
	const userId = $derived($currentSession?.user.id);

	async function loadCatalogue(index: number) {
		const own = ++generation;
		abort?.abort();
		abort = new AbortController();
		const scope = `${userId ?? ''}:${query.tab}:${query.source}`;
		if (scope !== loadedScope) {
			catalogue = { nbResults: 0, page: index, hasNext: false, results: [] };
			loadedScope = scope;
		}
		busy = true;
		error = '';
		try {
			const options = { signal: abort.signal };
			let result: AuctionPage;
			if (query.tab === 'explore')
				result = await getAuctions(
					{
						page: index,
						q: query.q,
						variant: query.variant.split(',').filter(Boolean),
						sellerId: query.seller,
						pageId: query.pageId,
						wishlist: query.wishlist,
						phase: query.phase,
						minPrice: query.min,
						maxPrice: query.max,
						sortBy: query.sortBy,
						sortDirection: query.sortDirection
					},
					options
				);
			else if (query.tab === 'favorites') result = await getAuctionFavorites(index, options);
			else {
				const search = {
					page: index,
					status: query.tab === 'history' ? query.status || undefined : 'OPEN'
				};
				if (query.tab === 'sales' || (query.tab === 'history' && query.source === 'sales'))
					result = await getMyAuctions(options, search);
				else {
					const bids = await getMyBids(options, search);
					result = { ...bids, results: bids.auctions };
					if (own === generation) auctionEscrowed.set(bids.escrowed);
				}
			}
			if (own === generation) catalogue = result;
		} catch {
			if (own === generation) {
				error = 'auctionHub.readListError';
				catalogue = { nbResults: 0, page: index, results: [] };
			}
		} finally {
			if (own === generation) busy = false;
		}
	}
	$effect(() => {
		const snapshot = query;
		const account = userId;
		untrack(() => {
			if (snapshot.tab === 'explore' || account) void loadCatalogue(snapshot.page);
		});
	});
	onMount(() => {
		const timer = setInterval(() => (now = Date.now()), 1000);
		return () => {
			generation++;
			abort?.abort();
			clearInterval(timer);
		};
	});
	function change(patch: Record<string, string>) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(patch)) {
			if (value && value !== '0') params.set(key, value);
			else params.delete(key);
		}
		void goto(resolve(('/market' + (params.size ? '?' + params.toString() : '')) as '/market'), {
			keepFocus: true,
			noScroll: true
		});
	}
	async function refresh() {
		if (!busy) await loadCatalogue(query.page);
	}
</script>

<svelte:head><title>{$_('auctionHub.title')} · WikiForge</title></svelte:head>
<AuctionWorkspace
	{query}
	{catalogue}
	{userId}
	{busy}
	{error}
	{now}
	from={page.url.pathname + page.url.search}
	onChange={change}
	onRefresh={() => void refresh()}
/>
