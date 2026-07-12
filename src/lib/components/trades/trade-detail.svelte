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
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[88dvh] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col border-4 border-double border-primary/40 bg-card shadow-2xl"
		>
			<header class="border-b border-primary/20 p-4">
				<Dialog.Title class="font-serif text-2xl font-black uppercase tracking-tight">
					{$_('trades.detail_title')}
				</Dialog.Title>
			</header>
			{#if offer}
				<div class="overflow-y-auto p-4">
					<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{offer.id}</p>
					<div class="mt-5 flex flex-col gap-5">
						<section>
							<h2 class="font-serif text-xl font-black uppercase">{$_('trades.offered')}</h2>
							<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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
							<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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
					<div class="mt-5 flex flex-wrap gap-2">
						{#if isIncoming && offer.status === 'pending'}
							<Button onclick={() => onRespond(offer.id, 'accepted')}>{$_('trades.accept')}</Button>
							<Button variant="outline" onclick={() => onCounterOffer(offer)}
								>{$_('trades.counter_offer')}</Button
							>
							<Button variant="destructive" onclick={() => onRespond(offer.id, 'rejected')}
								>{$_('trades.reject')}</Button
							>
						{/if}
						{#if isOutgoing && offer.status === 'pending'}
							<Button variant="destructive" onclick={() => onCancel(offer.id)}
								>{$_('trades.cancel')}</Button
							>
						{/if}
					</div>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
