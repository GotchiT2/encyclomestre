<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import { getAuctions } from '$lib/api/auctions';
	import { refreshPersonalAuctions } from '$lib/auctions/store';
	import { marketQuery } from '$lib/auctions/presentation';
	import type { AuctionPage } from '$lib/types';
	import AuctionWorkspace from '$lib/components/market/auction-workspace.svelte';
	let catalogue = $state<AuctionPage>({ nbResults: 0, page: 0, results: [] });
	let busy = $state(false);
	let error = $state('');
	let now = $state(Date.now());
	let generation = 0;
	let abort: AbortController | undefined;
	const query = $derived(marketQuery(page.url.searchParams));
	const userId = $derived($currentSession?.user.id);
	const publicPage = $derived(query.tab === 'explore' ? query.page : -1);
	async function loadCatalogue(index: number) {
		const own = ++generation;
		abort?.abort();
		abort = new AbortController();
		busy = true;
		error = '';
		try {
			const result = await getAuctions(index, { signal: abort.signal });
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
		const index = publicPage;
		untrack(() => {
			if (index >= 0) void loadCatalogue(index);
			else {
				generation++;
				abort?.abort();
				busy = false;
				error = '';
			}
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
		if (busy) return;
		if (query.tab === 'explore') await loadCatalogue(query.page);
		else if (userId) {
			busy = true;
			error = '';
			try {
				await refreshPersonalAuctions(userId);
			} catch {
				error = 'auctionHub.personalError';
			} finally {
				busy = false;
			}
		}
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
