<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CardActions from './card-actions.svelte';
	import CardMarketSummary from './card-market-summary.svelte';
	import CardTagControls from './card-tag-controls.svelte';
	import CardTelemetry from './card-telemetry.svelte';
	import FriendOwnerLedger from '$lib/components/social/friend-owner-ledger.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
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
</script>

<div class="fixed inset-0 z-50 bg-black/75 p-4" role="presentation" onclick={onClose}>
	<dialog
		open
		class="fixed top-1/2 left-1/2 m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-screen-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-4 border-double border-primary/40 bg-card p-4 text-foreground shadow-2xl sm:p-6"
		aria-labelledby="card-detail-modal-title"
		onclick={(event) => event.stopPropagation()}
	>
		<div class="mb-5 flex justify-end">
			<Button size="sm" variant="outline" onclick={onClose}>{$_('cardDetail.close')}</Button>
		</div>
		<section class="grid gap-6 lg:grid-cols-[minmax(15rem,0.42fr)_minmax(0,1fr)]">
			<div class="mx-auto w-full max-w-xs border border-primary/30 bg-black p-3">
				<div class="border border-primary/20 bg-card p-2">
					<img src={card.imageUrl} alt={card.title} class="aspect-[4/3] w-full object-cover" />
					<p
						class="mt-3 font-mono text-[10px] uppercase tracking-widest"
						style={`color:${card.rarityColor}`}
					>
						{card.rarityInitials} · {card.rarity}
					</p>
					<h2 class="mt-1 font-serif text-xl font-black uppercase tracking-tight">{card.title}</h2>
				</div>
			</div>
			<div class="flex min-w-0 flex-col gap-5">
				<header class="border-b border-dashed border-primary/30 pb-5">
					<h1
						id="card-detail-modal-title"
						class="font-serif text-3xl font-black uppercase tracking-tight sm:text-4xl"
					>
						{card.title}
					</h1>
					<p class="mt-3 font-serif italic leading-relaxed text-muted-foreground">
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
				{#if owned}
					<CardTagControls cardId={card.id} bind:tags bind:assignments />
				{/if}
				<CardTelemetry {card} />
				<CardMarketSummary {sales} {history} onMarket={() => goto(resolve('/market'))} />
				<FriendOwnerLedger friends={card.friendsWhoOwn} />
				{#if card.wikipediaUrl}
					<Button href={card.wikipediaUrl} target="_blank">{$_('codex.wikipedia')}</Button>
				{/if}
			</div>
		</section>
	</dialog>
</div>
