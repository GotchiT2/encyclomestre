<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { CardRecord, TradeOffer } from '$lib/types';

	let {
		open = $bindable(false),
		offer,
		cards,
		currentUserId,
		onCounterOffer,
		onRespond,
		onCancel
	}: {
		open?: boolean;
		offer: TradeOffer | null;
		cards: CardRecord[];
		currentUserId: string;
		onCounterOffer: (offer: TradeOffer) => void;
		onRespond: (id: string, status: 'accepted' | 'rejected') => void;
		onCancel: (id: string) => void;
	} = $props();

	const offeredCards = $derived(
		offer
			? (offer.offeredCardIds
					.map((id) => cards.find((card) => card.id === id))
					.filter(Boolean) as CardRecord[])
			: []
	);
	const requestedCards = $derived(
		offer
			? (offer.requestedCardIds
					.map((id) => cards.find((card) => card.id === id))
					.filter(Boolean) as CardRecord[])
			: []
	);
	const isIncoming = $derived(offer?.recipientId === currentUserId);
	const isOutgoing = $derived(offer?.initiatorId === currentUserId);
	const initiatorName = $derived(
		offer ? offer.initiator.displayName.trim() || offer.initiator.username || offer.initiatorId : ''
	);
	const recipientName = $derived(
		offer ? offer.recipient.displayName.trim() || offer.recipient.username || offer.recipientId : ''
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border-4 border-double border-primary/40 bg-card shadow-2xl sm:w-[calc(100%-2rem)]"
		>
			<header class="shrink-0 border-b border-primary/20 p-3 pr-12 sm:p-4 sm:pr-14">
				<Dialog.Title class="font-serif text-xl font-black uppercase tracking-tight sm:text-2xl">
					{$_('trades.detail_title')}
				</Dialog.Title>
				{#if offer}
					<p class="mt-1 break-words text-xs text-muted-foreground sm:text-sm">
						{initiatorName} <span class="text-primary">→</span>
						{recipientName}
					</p>
				{/if}
			</header>
			{#if offer}
				<div class="min-h-0 overflow-y-auto p-3 sm:p-4">
					<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{offer.id}</p>
					<div class="mt-5 flex flex-col gap-5">
						<section>
							<h2 class="font-serif text-xl font-black uppercase">{$_('trades.offered')}</h2>
							<div
								class="mt-3 grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3"
							>
								{#each offeredCards as card (card.id)}
									<CardTile {card} showFriendOwners={false} />
								{/each}
							</div>
							{#if offer.offeredCredits > 0}
								<span
									class="mt-3 inline-block border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] uppercase text-primary"
								>
									{offer.offeredCredits}
									{$_('trades.credit_chip')}
								</span>
							{/if}
						</section>
						<section>
							<h2 class="font-serif text-xl font-black uppercase">{$_('trades.requested')}</h2>
							<div
								class="mt-3 grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3"
							>
								{#each requestedCards as card (card.id)}
									<CardTile {card} showFriendOwners={false} />
								{/each}
							</div>
							{#if offer.requestedCredits > 0}
								<span
									class="mt-3 inline-block border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] uppercase text-primary"
								>
									{offer.requestedCredits}
									{$_('trades.credit_chip')}
								</span>
							{/if}
						</section>
					</div>
					<div
						class="sticky bottom-0 mt-5 grid grid-cols-1 gap-2 border-t border-primary/20 bg-card/95 py-3 backdrop-blur-sm sm:flex sm:flex-wrap"
					>
						{#if isIncoming && offer.status === 'pending'}
							<Button class="w-full sm:w-auto" onclick={() => onRespond(offer.id, 'accepted')}
								>{$_('trades.accept')}</Button
							>
							<Button
								class="w-full sm:w-auto"
								variant="outline"
								onclick={() => onCounterOffer(offer)}>{$_('trades.counter_offer')}</Button
							>
							<Button
								class="w-full sm:w-auto"
								variant="destructive"
								onclick={() => onRespond(offer.id, 'rejected')}>{$_('trades.reject')}</Button
							>
						{/if}
						{#if isOutgoing && offer.status === 'pending'}
							<Button
								class="w-full sm:w-auto"
								variant="destructive"
								onclick={() => onCancel(offer.id)}>{$_('trades.cancel')}</Button
							>
						{/if}
					</div>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
