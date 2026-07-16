<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardActions from './card-actions.svelte';
	import CardMarketSummary from './card-market-summary.svelte';
	import CardTagControls from './card-tag-controls.svelte';
	import CardTelemetry from './card-telemetry.svelte';
	import FriendOwnerLedger from '$lib/components/social/friend-owner-ledger.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import XIcon from '@lucide/svelte/icons/x';
	import type {
		CardPriceHistory,
		CardRecord,
		CollectionTag,
		CollectionTagAssignments,
		SaleListing,
		WishlistRegistrySummary
	} from '$lib/types';

	let {
		card,
		owned = false,
		wishlists = [],
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({}),
		sales = [],
		history = { cardId: card.id, points: [] },
		onToggleWishlist,
		onClose
	}: {
		card: CardRecord;
		owned?: boolean;
		wishlists?: WishlistRegistrySummary[];
		tags?: CollectionTag[];
		assignments?: CollectionTagAssignments;
		sales?: SaleListing[];
		history?: CardPriceHistory;
		onToggleWishlist: (wishlistId: string, selected: boolean) => void | Promise<void>;
		onClose: () => void;
	} = $props();

	let activeTab = $state<'data' | 'market' | 'social'>('data');
</script>

<div
	class="fixed inset-0 z-50 bg-[rgb(1_5_10_/_88%)] p-2 backdrop-blur-sm sm:p-5"
	role="presentation"
	onclick={onClose}
>
	<dialog
		open
		class="fixed inset-2 m-0 h-[calc(100dvh-1rem)] max-h-none w-[calc(100%-1rem)] max-w-none overflow-hidden border border-primary/35 bg-card p-0 text-foreground shadow-2xl sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)] sm:max-w-screen-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6"
		data-testid="card-detail-modal"
		aria-labelledby="card-detail-modal-title"
		onclick={(event) => event.stopPropagation()}
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgb(25_167_170_/_13%),transparent_32rem)]"
		></div>
		<div class="relative flex h-full min-h-0 flex-col sm:h-auto sm:max-h-[calc(100dvh-5.5rem)]">
			<div
				class="z-10 flex shrink-0 justify-end border-b border-primary/15 bg-card/95 p-2 sm:mb-4 sm:border-0 sm:bg-transparent sm:p-0"
			>
				<Button size="icon" variant="outline" onclick={onClose} aria-label={$_('cardDetail.close')}
					><XIcon /></Button
				>
			</div>
			<section
				class="relative grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain px-3 py-3 sm:gap-7 sm:p-0 lg:grid-cols-[minmax(17rem,0.42fr)_minmax(0,1fr)]"
			>
				<div class="card-detail-preview mx-auto w-fit lg:sticky lg:top-0 lg:self-start">
					<CardTile
						{card}
						tags={tags.filter((tag) => (assignments[card.id] ?? []).includes(tag.id))}
						showFriendOwners={false}
					/>
				</div>
				<div class="flex min-h-0 min-w-0 flex-col gap-4 sm:gap-5">
					<header class="forge-divider">
						<p class="forge-label" style={`color:${card.rarityColor}`}>
							{card.rarityInitials} · {card.rarity}
						</p>
						<h1
							id="card-detail-modal-title"
							class="mt-2 font-serif text-2xl font-bold tracking-tight sm:text-5xl"
						>
							{card.title}
						</h1>
						<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
							{card.longDescription}
						</p>
					</header>
					<div class="hidden sm:block">
						<CardActions
							card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
							{wishlists}
							{onToggleWishlist}
							onTrade={() => undefined}
							onMarket={() => goto(resolve('/market'))}
							onSell={() => goto(resolve('/market'))}
						/>
					</div>

					<div
						class="flex gap-1 overflow-x-auto border-b border-primary/20"
						role="tablist"
						aria-label={$_('cardDetail.tabs')}
					>
						{#each [{ id: 'data', label: 'cardDetail.data' }, { id: 'market', label: 'cardDetail.market_tab' }, { id: 'social', label: 'cardDetail.social' }] as tab (tab.id)}
							<Button
								variant="ghost"
								class={activeTab === tab.id ? 'forge-nav-active' : ''}
								onclick={() => (activeTab = tab.id as typeof activeTab)}
								role="tab"
								aria-selected={activeTab === tab.id}>{$_(tab.label)}</Button
							>
						{/each}
					</div>

					<div class="forge-panel-flat p-4 sm:p-5" data-testid="card-detail-tab-panel">
						{#if activeTab === 'data'}
							{#if owned}<CardTagControls cardId={card.id} bind:tags bind:assignments />{/if}
							<div class:mt-5={owned}><CardTelemetry {card} /></div>
							{#if card.wikipediaUrl}<Button href={card.wikipediaUrl} target="_blank" class="mt-5"
									>{$_('codex.wikipedia')}</Button
								>{/if}
						{:else if activeTab === 'market'}
							<CardMarketSummary {sales} {history} onMarket={() => goto(resolve('/market'))} />
						{:else}
							<FriendOwnerLedger friends={card.friendsWhoOwn} />
						{/if}
					</div>
				</div>
			</section>
			<div
				class="min-h-[4.25rem] shrink-0 border-t border-primary/25 bg-[rgb(8_15_25_/_96%)] p-3 sm:hidden"
				data-testid="card-detail-mobile-actions"
			>
				<CardActions
					card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
					{wishlists}
					{onToggleWishlist}
					onTrade={() => undefined}
					onMarket={() => goto(resolve('/market'))}
					onSell={() => goto(resolve('/market'))}
				/>
			</div>
		</div>
	</dialog>
</div>

<style>
	.card-detail-preview :global(.wikiforge-card-size) {
		width: 10.5rem;
	}

	@media (min-width: 640px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 13rem;
		}
	}

	@media (min-width: 1280px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 17rem;
		}
	}
</style>
