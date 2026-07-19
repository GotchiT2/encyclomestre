<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import ContextualCardRail from '$lib/components/cards/contextual-card-rail.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { CardRecord, TradeOffer } from '$lib/types';

	let {
		open = $bindable(false),
		offer,
		offeredCards,
		requestedCards,
		currentUserId,
		onCounterOffer,
		onRespond,
		onCancel
	}: {
		open?: boolean;
		offer: TradeOffer | null;
		offeredCards: CardRecord[];
		requestedCards: CardRecord[];
		currentUserId: string;
		onCounterOffer: (offer: TradeOffer) => void;
		onRespond: (id: string, status: 'accepted' | 'rejected') => void;
		onCancel: (id: string) => void;
	} = $props();

	const isIncoming = $derived(offer?.recipientId === currentUserId);
	const isOutgoing = $derived(offer?.initiatorId === currentUserId);
	const initiatorName = $derived(
		offer ? offer.initiator.displayName.trim() || offer.initiator.username || offer.initiatorId : ''
	);
	const recipientName = $derived(
		offer ? offer.recipient.displayName.trim() || offer.recipient.username || offer.recipientId : ''
	);
	const missingOfferedCards = $derived(
		Math.max(0, (offer?.offeredCardIds.length ?? 0) - offeredCards.length)
	);
	const missingRequestedCards = $derived(
		Math.max(0, (offer?.requestedCardIds.length ?? 0) - requestedCards.length)
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		preventScroll={true}
		class="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 sm:w-[calc(100%-2rem)]"
		data-testid="trade-detail-modal"
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
			<div
				class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
				data-testid="trade-detail-scroll"
			>
				<div class="flex flex-col gap-5">
					<section>
						<h2 class="font-serif text-xl font-black uppercase">{$_('trades.offered')}</h2>
						<ContextualCardRail
							class="mt-3"
							items={offeredCards}
							label={$_('trades.offered')}
							itemKey={(card) => card.id}
							desktopGridClass="lg:grid-cols-3 xl:grid-cols-4"
						>
							{#snippet children(card)}
								<CardTile {card} showFriendOwners={false} />
							{/snippet}
						</ContextualCardRail>
						{#if missingOfferedCards}
							<p
								class="mt-3 border border-destructive/35 bg-destructive/10 p-2 text-sm text-destructive"
							>
								{$_('trades.cards_unavailable', { values: { count: missingOfferedCards } })}
							</p>
						{/if}
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
						<ContextualCardRail
							class="mt-3"
							items={requestedCards}
							label={$_('trades.requested')}
							itemKey={(card) => card.id}
							desktopGridClass="lg:grid-cols-3 xl:grid-cols-4"
						>
							{#snippet children(card)}
								<CardTile {card} showFriendOwners={false} />
							{/snippet}
						</ContextualCardRail>
						{#if missingRequestedCards}
							<p
								class="mt-3 border border-destructive/35 bg-destructive/10 p-2 text-sm text-destructive"
							>
								{$_('trades.cards_unavailable', { values: { count: missingRequestedCards } })}
							</p>
						{/if}
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
			</div>
			<footer
				class="z-10 grid shrink-0 grid-cols-1 gap-2 border-t border-primary/20 bg-card p-3 shadow-[0_-12px_30px_rgb(0_0_0_/_35%)] sm:flex sm:flex-wrap sm:p-4"
				data-testid="trade-detail-actions"
			>
				{#if isIncoming && offer.status === 'pending'}
					<Button class="w-full sm:w-auto" onclick={() => onRespond(offer.id, 'accepted')}
						>{$_('trades.accept')}</Button
					>
					<Button class="w-full sm:w-auto" variant="outline" onclick={() => onCounterOffer(offer)}
						>{$_('trades.counter_offer')}</Button
					>
					<Button
						class="w-full sm:w-auto"
						variant="destructive"
						onclick={() => onRespond(offer.id, 'rejected')}>{$_('trades.reject')}</Button
					>
				{/if}
				{#if isOutgoing && offer.status === 'pending'}
					<Button class="w-full sm:w-auto" variant="destructive" onclick={() => onCancel(offer.id)}
						>{$_('trades.cancel')}</Button
					>
				{/if}
			</footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
