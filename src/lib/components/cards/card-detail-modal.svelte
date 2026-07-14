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
		SaleListing
	} from '$lib/types';

	let {
		card,
		owned = false,
		isWishlisted = false,
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({}),
		sales = [],
		history = { cardId: card.id, points: [] },
		onToggleWishlist,
		onClose
	}: {
		card: CardRecord;
		owned?: boolean;
		isWishlisted?: boolean;
		tags?: CollectionTag[];
		assignments?: CollectionTagAssignments;
		sales?: SaleListing[];
		history?: CardPriceHistory;
		onToggleWishlist: () => void;
		onClose: () => void;
	} = $props();

	let activeTab = $state<'data' | 'market' | 'social'>('data');
</script>

<div
	class="fixed inset-0 z-50 bg-[rgb(1_5_10_/_88%)] p-0 backdrop-blur-sm sm:p-5"
	role="presentation"
	onclick={onClose}
>
	<dialog
		open
		class="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-card p-4 text-foreground shadow-2xl sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)] sm:max-w-screen-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:border-primary/40 sm:p-6"
		data-testid="card-detail-modal"
		aria-labelledby="card-detail-modal-title"
		onclick={(event) => event.stopPropagation()}
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgb(25_167_170_/_13%),transparent_32rem)]"
		></div>
		<div class="relative mb-4 flex justify-end">
			<Button size="icon" variant="outline" onclick={onClose} aria-label={$_('cardDetail.close')}
				><XIcon /></Button
			>
		</div>
		<section class="relative grid gap-7 lg:grid-cols-[minmax(17rem,0.42fr)_minmax(0,1fr)]">
			<div class="mx-auto w-fit lg:sticky lg:top-0 lg:self-start">
				<CardTile
					{card}
					tags={tags.filter((tag) => (assignments[card.id] ?? []).includes(tag.id))}
					showFriendOwners={false}
					onOpen={() => undefined}
				/>
			</div>
			<div class="flex min-h-0 min-w-0 flex-col gap-5">
				<header class="forge-divider">
					<p class="forge-label" style={`color:${card.rarityColor}`}>
						{card.rarityInitials} · {card.rarity}
					</p>
					<h1
						id="card-detail-modal-title"
						class="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-5xl"
					>
						{card.title}
					</h1>
					<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
						{card.longDescription}
					</p>
				</header>
				<CardActions
					card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
					{isWishlisted}
					{onToggleWishlist}
					onTrade={() => undefined}
					onMarket={() => goto(resolve('/market'))}
					onSell={() => goto(resolve('/market'))}
				/>

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
	</dialog>
</div>
