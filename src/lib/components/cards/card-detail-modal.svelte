<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardActions from './card-actions.svelte';
	import CardMarketModal from './card-market-modal.svelte';
	import CardTagControls from './card-tag-controls.svelte';
	import CardTelemetry from './card-telemetry.svelte';
	import FriendOwnerLedger from '$lib/components/social/friend-owner-ledger.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog } from 'bits-ui';
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
		sales,
		history,
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

	let activeTab = $state<'data' | 'social'>('data');
	let marketOpen = $state(false);
</script>

<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-[100] bg-[rgb(1_5_10_/_88%)] backdrop-blur-sm"
			data-testid="card-detail-overlay"
		/>
		<Dialog.Content
			preventScroll={false}
			class="fixed inset-2 z-[101] h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none overflow-hidden border border-primary/35 bg-card p-0 text-foreground shadow-2xl outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)] sm:max-w-screen-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-4"
			data-testid="card-detail-modal"
		>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgb(25_167_170_/_13%),transparent_32rem)]"
			></div>
			<div class="relative flex h-full min-h-0 flex-col sm:h-auto sm:max-h-[calc(100dvh-4.5rem)]">
				<div
					class="z-10 flex shrink-0 justify-end border-b border-primary/15 bg-card/95 p-2 sm:absolute sm:top-0 sm:right-0 sm:border-0 sm:bg-transparent sm:p-0"
				>
					<Button
						size="icon"
						variant="outline"
						onclick={onClose}
						aria-label={$_('cardDetail.close')}><XIcon /></Button
					>
				</div>
				<section
					class="relative grid min-h-0 flex-1 gap-3 overflow-y-auto overscroll-contain px-3 py-3 sm:gap-5 sm:p-0 lg:grid-cols-[minmax(18rem,0.48fr)_minmax(0,1fr)] xl:grid-cols-[minmax(21rem,0.52fr)_minmax(0,1fr)]"
				>
					<div class="card-detail-preview mx-auto w-fit lg:sticky lg:top-0 lg:self-start">
						<CardTile
							{card}
							tags={tags.filter((tag) => (assignments[card.id] ?? []).includes(tag.id))}
							showFriendOwners={false}
						/>
					</div>
					<div class="flex min-h-0 min-w-0 flex-col gap-3">
						<header class="forge-divider pb-3 sm:pr-14">
							<p class="forge-label" style={`color:${card.rarityColor}`}>
								{card.rarityInitials} · {card.rarity}
							</p>
							<Dialog.Title
								id="card-detail-modal-title"
								class="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
							>
								{card.title}
							</Dialog.Title>
							<p class="mt-2 max-w-3xl text-sm leading-snug text-muted-foreground">
								{card.longDescription}
							</p>
						</header>
						<div class="hidden sm:block">
							<CardActions
								card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
								{wishlists}
								{onToggleWishlist}
								onTrade={() => undefined}
								onMarket={() => (marketOpen = true)}
								onSell={() => goto(resolve('/market'))}
							/>
						</div>

						<div
							class="hidden gap-1 overflow-x-auto border-b border-primary/20 sm:flex"
							role="tablist"
							aria-label={$_('cardDetail.tabs')}
						>
							{#each [{ id: 'data', label: 'cardDetail.data' }, { id: 'social', label: 'cardDetail.social' }] as tab, index (tab.id)}
								<Button
									variant="ghost"
									class={activeTab === tab.id ? 'forge-nav-active' : ''}
									onclick={() => (activeTab = tab.id as typeof activeTab)}
									role="tab"
									aria-selected={activeTab === tab.id}>{$_(tab.label)}</Button
								>
								{#if index === 0}
									<Button variant="ghost" onclick={() => (marketOpen = true)}>
										{$_('cardDetail.market_tab')}
									</Button>
								{/if}
							{/each}
						</div>

						<div class="forge-panel-flat p-3" data-testid="card-detail-tab-panel">
							{#if activeTab === 'data'}
								{#if owned}<CardTagControls cardId={card.id} bind:tags bind:assignments />{/if}
								<div class:mt-3={owned}><CardTelemetry {card} /></div>
								{#if card.wikipediaUrl}<Button href={card.wikipediaUrl} target="_blank" class="mt-3"
										>{$_('codex.wikipedia')}</Button
									>{/if}
							{:else}
								<FriendOwnerLedger friends={card.friendsWhoOwn} />
							{/if}
						</div>
					</div>
				</section>
				<div
					class="flex min-h-11 shrink-0 border-t border-b border-primary/25 bg-[rgb(8_15_25_/_98%)] sm:hidden"
					role="tablist"
					aria-label={$_('cardDetail.tabs')}
					data-testid="card-detail-mobile-tabs"
				>
					{#each [{ id: 'data', label: 'cardDetail.data' }, { id: 'social', label: 'cardDetail.social' }] as tab, index (tab.id)}
						<Button
							variant="ghost"
							class={`min-w-0 flex-1 px-2 ${activeTab === tab.id ? 'forge-nav-active' : ''}`}
							onclick={() => (activeTab = tab.id as typeof activeTab)}
							role="tab"
							aria-selected={activeTab === tab.id}>{$_(tab.label)}</Button
						>
						{#if index === 0}
							<Button
								variant="ghost"
								class="min-w-0 flex-1 px-2"
								onclick={() => (marketOpen = true)}>{$_('cardDetail.market_tab')}</Button
							>
						{/if}
					{/each}
				</div>
				<div
					class="min-h-[4.25rem] shrink-0 border-t border-primary/25 bg-[rgb(8_15_25_/_96%)] p-3 sm:hidden"
					data-testid="card-detail-mobile-actions"
				>
					<CardActions
						card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
						{wishlists}
						{onToggleWishlist}
						onTrade={() => undefined}
						onMarket={() => (marketOpen = true)}
						onSell={() => goto(resolve('/market'))}
					/>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

{#if marketOpen}
	<CardMarketModal {card} {history} {sales} onClose={() => (marketOpen = false)} />
{/if}

<style>
	.card-detail-preview :global(.wikiforge-card-size) {
		width: 12rem;
	}

	@media (min-width: 640px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 15rem;
		}
	}

	@media (min-width: 1024px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 18rem;
		}
	}

	@media (min-width: 1280px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 21rem;
		}
	}
</style>
