<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- card actions append dynamic query parameters */
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import {
		addWishlistRegistryCard,
		getWishlistRegistry,
		getWishlists,
		removeWishlistRegistryCard
	} from '$lib/api';
	import CardActions from '$lib/components/cards/card-actions.svelte';
	import CardMarketSummary from '$lib/components/cards/card-market-summary.svelte';
	import CardTagControls from '$lib/components/cards/card-tag-controls.svelte';
	import CardTelemetry from '$lib/components/cards/card-telemetry.svelte';
	import CardTile from '$lib/components/card-tile.svelte';
	import FriendOwnerLedger from '$lib/components/social/friend-owner-ledger.svelte';
	import {
		restoreCollectionTagState,
		persistCollectionTagState
	} from '$lib/collection/tag-persistence';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CollectionTag, CollectionTagAssignments } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let userId = $state('demo-user');
	let primaryWishlistId = $state<string | null>(null);
	let wishlistCardIds = $state<string[]>([]);
	let tags = $state<CollectionTag[]>([]);
	let assignments = $state<CollectionTagAssignments>({});
	let hasHydratedTags = $state(false);

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		({ tags, assignments } = restoreCollectionTagState(localStorage));
		hasHydratedTags = true;
		const wishlists = await getWishlists(userId);
		if (!wishlists[0]) return;
		primaryWishlistId = wishlists[0].id;
		wishlistCardIds = (await getWishlistRegistry(wishlists[0].id, userId)).cardIds;
	});

	$effect(() => {
		if (browser && hasHydratedTags) persistCollectionTagState(localStorage, { tags, assignments });
	});

	async function toggleWishlist(cardId: string) {
		if (!primaryWishlistId) return;
		const next = wishlistCardIds.includes(cardId)
			? await removeWishlistRegistryCard(primaryWishlistId, userId, cardId)
			: await addWishlistRegistryCard(primaryWishlistId, userId, cardId);
		wishlistCardIds = next.cardIds;
	}

	function closeDetail() {
		goto('/cards');
	}
</script>

{#await data.card}
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('codex.loading')}</p>
{:then card}
	<div class="fixed inset-0 z-50 bg-black/75 p-4" role="presentation" onclick={closeDetail}>
		<dialog
			open
			class="fixed top-1/2 left-1/2 m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-screen-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-4 border-double border-primary/40 bg-card p-4 text-foreground shadow-2xl sm:p-6 lg:h-[calc(100dvh-3rem)] lg:overflow-hidden"
			aria-labelledby="card-detail-title"
			onclick={(event) => event.stopPropagation()}
		>
			<div class="mb-5 flex justify-end">
				<Button size="sm" variant="outline" onclick={closeDetail}>{$_('cardDetail.close')}</Button>
			</div>
			<section
				class="grid gap-6 lg:h-[calc(100%-4rem)] lg:grid-cols-[minmax(15rem,0.42fr)_minmax(0,1fr)]"
			>
				<div class="mx-auto w-full max-w-xs">
					<CardTile
						{card}
						tags={tags.filter((tag) => (assignments[card.id] ?? []).includes(tag.id))}
						showFriendOwners={false}
					/>
				</div>
				<div class="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto">
					<header class="border-b border-dashed border-primary/30 pb-5">
						<h1
							id="card-detail-title"
							class="font-serif text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl"
						>
							{card.title}
						</h1>
						<p class="mt-3 font-serif italic leading-relaxed text-muted-foreground">
							{card.longDescription}
						</p>
					</header>
					<CardActions
						{card}
						isWishlisted={wishlistCardIds.includes(card.id)}
						onToggleWishlist={() => toggleWishlist(card.id)}
						onTrade={() =>
							goto(
								`/trades?partner=${encodeURIComponent(card.friendsWhoOwn[0]?.friendId ?? '')}&cards=${encodeURIComponent(card.id)}`
							)}
						onMarket={() => goto(`/market?card=${encodeURIComponent(card.id)}`)}
						onSell={() => goto(`/market/sell?card=${encodeURIComponent(card.id)}`)}
					/>
					<CardTagControls cardId={card.id} bind:tags bind:assignments />
					<CardTelemetry {card} />
					{#await Promise.all([data.sales, data.priceHistory])}<p
							class="font-mono text-[10px] uppercase tracking-widest text-primary"
						>
							{$_('codex.loading')}
						</p>{:then [sales, history]}<CardMarketSummary
							{sales}
							{history}
							onMarket={() => goto(`/market?card=${encodeURIComponent(card.id)}`)}
						/>{:catch}<p class="font-serif italic text-muted-foreground">
							{$_('codex.priceUnavailable')}
						</p>{/await}
					<FriendOwnerLedger friends={card.friendsWhoOwn} />
					<Button href={card.wikipediaUrl} target="_blank">{$_('codex.wikipedia')}</Button>
				</div>
			</section>
		</dialog>
	</div>
{:catch}
	<p class="border border-destructive/40 bg-destructive/10 p-4 font-serif italic text-destructive">
		{$_('codex.error')}
	</p>
{/await}
