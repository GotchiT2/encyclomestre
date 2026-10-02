<script lang="ts">
	import SanctionNotice from '$lib/components/moderation/sanction-notice.svelte';
	import { activeRestrictions } from '$lib/moderation/state';
	import { _ } from '$lib/i18n';
	import ReportDialog from '$lib/components/reports/report-dialog.svelte';
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
		removedCardIds = [],
		currentUserId,
		onCounterOffer,
		onRespond,
		onCancel
	}: {
		open?: boolean;
		offer: TradeOffer | null;
		offeredCards: CardRecord[];
		requestedCards: CardRecord[];
		removedCardIds?: string[];
		currentUserId: string;
		onCounterOffer: (offer: TradeOffer) => void;
		onRespond: (id: string, status: 'accepted' | 'declined') => void;
		onCancel: (id: string) => void;
	} = $props();

	const isIncoming = $derived(offer?.recipientId === currentUserId);
	const isOutgoing = $derived(offer?.initiatorId === currentUserId);
	const isOpen = $derived(offer?.status === 'pending' || offer?.status === 'countered');
	const initiatorName = $derived(
		offer ? offer.initiator.displayName.trim() || offer.initiator.username || offer.initiatorId : ''
	);
	const recipientName = $derived(
		offer ? offer.recipient.displayName.trim() || offer.recipient.username || offer.recipientId : ''
	);
	const missingOfferedCards = $derived(
		Math.max(
			0,
			(offer?.offeredCardIds.length ?? 0) -
				offeredCards.filter((card) => !removedCardIds.includes(card.id)).length
		)
	);
	const missingRequestedCards = $derived(
		Math.max(
			0,
			(offer?.requestedCardIds.length ?? 0) -
				requestedCards.filter((card) => !removedCardIds.includes(card.id)).length
		)
	);
	const formattedExpiration = $derived(
		offer?.expiresAt
			? new Date(offer.expiresAt).toLocaleString('fr-FR', {
					dateStyle: 'short',
					timeStyle: 'short'
				})
			: ''
	);
	const offeredMoneyDifference = $derived(
		(offer?.offeredMoney ?? 0) - (offer?.originalOfferedMoney ?? offer?.offeredMoney ?? 0)
	);
	const requestedMoneyDifference = $derived(
		(offer?.requestedMoney ?? 0) - (offer?.originalRequestedMoney ?? offer?.requestedMoney ?? 0)
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		preventScroll={true}
		class="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 sm:w-[calc(100%-2rem)] p-0 sm:p-0 overflow-hidden"
		data-testid="trade-detail-modal"
	>
		<header class="shrink-0 border-b border-primary/20 p-3 pr-12 sm:p-4 sm:pr-14">
			<Dialog.Title class="text-xl font-black uppercase tracking-tight sm:text-2xl">
				{$_('trades.detail_title')}
			</Dialog.Title>
			{#if offer}
				<p class="mt-1 break-words text-xs text-muted-foreground sm:text-sm">
					{initiatorName} <span class="text-primary">→</span>
					{recipientName}
				</p>
				<div
					class="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-wider"
				>
					<span class="text-primary">{$_(`trades.status.${offer.status}`)}</span>
					{#if isOpen && formattedExpiration}
						<span class="text-muted-foreground">
							{$_('trades.expires_on', { values: { date: formattedExpiration } })}
						</span>
					{/if}
				</div>
				{#if offer.message}
					<p class="mt-2 border-l-2 border-primary/35 pl-3 text-sm italic text-muted-foreground">
						{offer.message}
					</p>
				{/if}
			{/if}
			{#if offer}<ReportDialog
					target={{ type: 'USER', id: Number(isIncoming ? offer.initiatorId : offer.recipientId) }}
					title={isIncoming ? initiatorName : recipientName}
					userId={Number(isIncoming ? offer.initiatorId : offer.recipientId)}
				/>{/if}
		</header>
		<SanctionNotice kind="TRADE" />
		{#if offer}
			<div
				class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
				data-testid="trade-detail-scroll"
			>
				<div class="flex flex-col gap-5">
					<section>
						<h2 class="text-xl font-black uppercase">{$_('trades.offered')}</h2>
						<p class="mt-2 forge-label">
							{$_('trades.money_amount', { values: { amount: offer.offeredMoney ?? 0 } })}
						</p>
						{#if offeredMoneyDifference !== 0}<p
								class="mt-1 font-mono text-[9px] text-muted-foreground"
							>
								{$_('trades.money_difference', {
									values: {
										amount: `${offeredMoneyDifference > 0 ? '+' : ''}${offeredMoneyDifference}`
									}
								})}
							</p>{/if}
						<ContextualCardRail
							class="mt-3"
							compact
							items={offeredCards}
							label={$_('trades.offered')}
							itemKey={(card) => card.id}
							desktopGridClass="lg:grid-cols-4"
						>
							{#snippet children(card)}
								<div class:opacity-45={removedCardIds.includes(card.id)}>
									{#if removedCardIds.includes(card.id)}<p
											class="mb-1 forge-label text-destructive"
										>
											{$_('trades.card_removed')}
										</p>{/if}
									<CardTile {card} showFriendOwners={false} />
								</div>
							{/snippet}
						</ContextualCardRail>
						{#if missingOfferedCards}
							<p
								class="mt-3 border border-destructive/35 bg-destructive/10 p-2 text-sm text-destructive"
							>
								{$_('trades.cards_unavailable', { values: { count: missingOfferedCards } })}
							</p>
						{/if}
					</section>
					<section>
						<h2 class="text-xl font-black uppercase">{$_('trades.requested')}</h2>
						<p class="mt-2 forge-label">
							{$_('trades.money_amount', { values: { amount: offer.requestedMoney ?? 0 } })}
						</p>
						{#if requestedMoneyDifference !== 0}<p
								class="mt-1 font-mono text-[9px] text-muted-foreground"
							>
								{$_('trades.money_difference', {
									values: {
										amount: `${requestedMoneyDifference > 0 ? '+' : ''}${requestedMoneyDifference}`
									}
								})}
							</p>{/if}
						<ContextualCardRail
							class="mt-3"
							compact
							items={requestedCards}
							label={$_('trades.requested')}
							itemKey={(card) => card.id}
							desktopGridClass="lg:grid-cols-4"
						>
							{#snippet children(card)}
								<div class:opacity-45={removedCardIds.includes(card.id)}>
									{#if removedCardIds.includes(card.id)}<p
											class="mb-1 forge-label text-destructive"
										>
											{$_('trades.card_removed')}
										</p>{/if}
									<CardTile {card} showFriendOwners={false} />
								</div>
							{/snippet}
						</ContextualCardRail>
						{#if missingRequestedCards}
							<p
								class="mt-3 border border-destructive/35 bg-destructive/10 p-2 text-sm text-destructive"
							>
								{$_('trades.cards_unavailable', { values: { count: missingRequestedCards } })}
							</p>
						{/if}
					</section>
				</div>
			</div>
			<footer
				class="z-10 grid shrink-0 grid-cols-1 gap-2 border-t border-primary/20 bg-card p-3 shadow-[0_-12px_30px_rgb(0_0_0_/_35%)] sm:flex sm:flex-wrap sm:p-4"
				data-testid="trade-detail-actions"
			>
				{#if isIncoming && isOpen}
					<Button
						class="w-full sm:w-auto"
						disabled={$activeRestrictions.includes('TRADE')}
						onclick={() => onRespond(offer.id, 'accepted')}>{$_('trades.accept')}</Button
					>
					<Button
						class="w-full sm:w-auto"
						variant="outline"
						disabled={$activeRestrictions.includes('TRADE')}
						onclick={() => onCounterOffer(offer)}>{$_('trades.counter_offer')}</Button
					>
					<Button
						class="w-full sm:w-auto"
						variant="destructive"
						onclick={() => onRespond(offer.id, 'declined')}>{$_('trades.reject')}</Button
					>
				{/if}
				{#if isOutgoing && isOpen}
					<Button class="w-full sm:w-auto" variant="destructive" onclick={() => onCancel(offer.id)}
						>{$_('trades.cancel')}</Button
					>
				{/if}
			</footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
