<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type { CardRecord, TradeOffer } from '$lib/types';

	let {
		offer,
		cards,
		currentUserId,
		onRespond,
		onView,
		onCounterOffer
	}: {
		offer: TradeOffer;
		cards: CardRecord[];
		currentUserId: string;
		onRespond: (id: string, status: 'accepted' | 'rejected') => void;
		onView: (offer: TradeOffer) => void;
		onCounterOffer: (offer: TradeOffer) => void;
	} = $props();

	const isIncoming = $derived(offer.recipientId === currentUserId);
	const statusClass = $derived(
		offer.status === 'accepted'
			? 'border-emerald-500/50 text-emerald-400'
			: offer.status === 'rejected'
				? 'border-destructive/50 text-destructive'
				: 'border-primary/50 text-primary'
	);
	const offeredCards = $derived(
		offer.offeredCardIds
			.map((id) => cards.find((card) => card.id === id))
			.filter(Boolean) as CardRecord[]
	);
	const requestedCards = $derived(
		offer.requestedCardIds
			.map((id) => cards.find((card) => card.id === id))
			.filter(Boolean) as CardRecord[]
	);
</script>

<article class="border border-primary/25 bg-card p-4 transition-colors hover:border-primary/60">
	<button type="button" class="block w-full cursor-pointer text-left" onclick={() => onView(offer)}>
		<header
			class="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-primary/20 pb-3"
		>
			<div>
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{isIncoming ? $_('trades.incoming') : $_('trades.outgoing')}
				</p>
				<h2 class="mt-1 font-serif text-xl font-black uppercase tracking-tight">
					{isIncoming
						? $_('trades.from', { values: { user: offer.initiatorId } })
						: $_('trades.to', { values: { user: offer.recipientId } })}
				</h2>
			</div>
			<span class={`border px-2 py-1 font-mono text-[9px] uppercase tracking-widest ${statusClass}`}
				>{$_(`trades.status.${offer.status}`)}</span
			>
		</header>
		<div class="grid gap-3 py-4 sm:grid-cols-2">
			<div class="border border-primary/15 bg-background/40 p-3">
				<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
					{$_('trades.offered')}
				</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each offeredCards as card (card.id)}<span
							class="border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
							style={`border-color:${card.rarityColor};color:${card.rarityColor}`}
							>{card.title}</span
						>{/each}{#if offer.offeredCredits > 0}<span
							class="border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
							>{offer.offeredCredits} {$_('trades.credit_chip')}</span
						>{/if}
				</div>
			</div>
			<div class="border border-primary/15 bg-background/40 p-3">
				<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
					{$_('trades.requested')}
				</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each requestedCards as card (card.id)}<span
							class="border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
							style={`border-color:${card.rarityColor};color:${card.rarityColor}`}
							>{card.title}</span
						>{/each}{#if offer.requestedCredits > 0}<span
							class="border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
							>{offer.requestedCredits} {$_('trades.credit_chip')}</span
						>{/if}
				</div>
			</div>
		</div>
	</button>
	{#if isIncoming && offer.status === 'pending'}<footer class="mt-4 flex flex-wrap gap-2">
			<Button
				size="sm"
				onclick={(event) => {
					event.stopPropagation();
					onRespond(offer.id, 'accepted');
				}}>{$_('trades.accept')}</Button
			><Button
				size="sm"
				variant="outline"
				onclick={(event) => {
					event.stopPropagation();
					onCounterOffer(offer);
				}}>{$_('trades.counter_offer')}</Button
			><Button
				size="sm"
				variant="destructive"
				onclick={(event) => {
					event.stopPropagation();
					onRespond(offer.id, 'rejected');
				}}>{$_('trades.reject')}</Button
			>
		</footer>{/if}
</article>
