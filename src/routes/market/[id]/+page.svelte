<script lang="ts">
	import { page } from '$app/state';
	import { untrack, onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import { getAuction, watchAuction, unwatchAuction } from '$lib/api/auctions';
	import { ApiError } from '$lib/api/client';
	import type { Auction } from '$lib/types';
	import { createAuctionDetailController } from '$lib/auctions/detail-controller';
	import { marketBackTarget } from '$lib/auctions/presentation';
	import { recordOwnAuction } from '$lib/auctions/store';
	import { publishRealtimeRefresh } from '$lib/realtime/resource-refresh';
	import AuctionDetailView from '$lib/components/market/auction-detail-view.svelte';
	import { Button } from '$lib/components/ui/button';
	let auction = $state<Auction | null>(null);
	let loading = $state(true);
	let error = $state('');
	let watchError = $state(false);
	let now = $state(Date.now());
	let controller: ReturnType<typeof createAuctionDetailController> | undefined;
	const id = $derived(page.params.id ?? '');
	const userId = $derived($currentSession?.user.id);
	const back = $derived(marketBackTarget(page.url.searchParams.get('from')));
	$effect(() => {
		const selectedId = id;
		const selectedUser = userId;
		return untrack(() => {
			auction = null;
			error = '';
			watchError = false;
			const current = createAuctionDetailController({
				id: selectedId,
				authenticated: Boolean(selectedUser),
				read: (signal) => getAuction(selectedId, { signal }),
				watch: () => watchAuction(selectedId),
				unwatch: () => unwatchAuction(selectedId),
				onValue: (next) => {
					auction = next;
					error = '';
				},
				onLoading: (value) => (loading = value),
				onError: (cause) =>
					(error =
						cause instanceof ApiError && cause.status === 404
							? 'auctionHub.notFound'
							: 'auctionHub.readError'),
				onWatchError: (cause) => (watchError = cause !== null)
			});
			controller = current;
			const onEvent = (event: Event) => {
				if (String((event as CustomEvent<{ id: number }>).detail?.id) === selectedId)
					current.event();
			};
			const onReady = () => current.event();
			window.addEventListener('wikiforge:auction-updated', onEvent);
			window.addEventListener('wikiforge:stream-ready', onReady);
			void current.reload();
			return () => {
				current.dispose();
				window.removeEventListener('wikiforge:auction-updated', onEvent);
				window.removeEventListener('wikiforge:stream-ready', onReady);
			};
		});
	});
	onMount(() => {
		const clock = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(clock);
	});
	function updated(next: Auction) {
		controller?.adopt({
			...next,
			bids: next.bids ?? (next.nbBids === auction?.nbBids ? auction.bids : undefined)
		});
		if (next.seller.id === userId) recordOwnAuction(next);
		publishRealtimeRefresh(['profile', 'collection']);
	}
	async function reload() {
		await controller?.reload();
	}
</script>

<svelte:head
	><title>{auction?.card.title ?? $_('market.auction_details')} · WikiForge</title></svelte:head
>
<main class="flex w-full min-w-0 flex-col gap-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Button href={back} variant="outline"
			>{$_(back.startsWith('/market') ? 'auctionHub.back' : 'auctionHub.backContext')}</Button
		>
		<Button variant="ghost" disabled={loading} onclick={() => void reload()}
			>{$_(loading && auction ? 'auctionHub.refreshing' : 'auctionHub.refresh')}</Button
		>
	</div>
	{#if error}<div role="alert" class="forge-panel space-y-3 p-5">
			<p>{$_(error)}</p>
			<Button variant="outline" disabled={loading} onclick={() => void reload()}
				>{$_('auctionHub.retry')}</Button
			>
		</div>{/if}
	{#if watchError}<p role="status" class="border border-primary/30 p-3 text-sm">
			{$_('auctionHub.watchError')}
		</p>{/if}
	{#if !auction && loading}<div class="forge-panel min-h-80 animate-pulse p-6" aria-busy="true">
			{$_('auctionHub.loading')}
		</div>{/if}
	{#if auction}
		{#key auction.id}<AuctionDetailView
				{auction}
				{userId}
				{now}
				onUpdated={updated}
				onConflict={reload}
			/>{/key}
	{/if}
</main>
