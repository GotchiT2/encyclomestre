<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import Undo2Icon from '@lucide/svelte/icons/undo-2';
	import XIcon from '@lucide/svelte/icons/x';
	import type { TradeCardDetail, TradeOffer } from '$lib/types';

	let {
		offer,
		cards,
		currentUserId,
		onRespond,
		onView,
		onMessage,
		onCounterOffer
	}: {
		offer: TradeOffer;
		cards: TradeCardDetail[];
		currentUserId: string;
		onRespond: (id: string, status: 'accepted' | 'declined') => void;
		onView: (offer: TradeOffer) => void;
		onMessage: (participantId: string) => void;
		onCounterOffer: (offer: TradeOffer) => void;
	} = $props();

	const isIncoming = $derived(offer.recipientId === currentUserId);
	const counterpart = $derived(isIncoming ? offer.initiator : offer.recipient);
	const counterpartName = $derived(
		counterpart.displayName.trim() || counterpart.username || counterpart.id
	);
	const initiatorName = $derived(
		offer.initiator.displayName.trim() || offer.initiator.username || offer.initiatorId
	);
	const offeredCards = $derived(cards.filter((entry) => entry.side === 'offered'));
	const requestedCards = $derived(cards.filter((entry) => entry.side === 'requested'));
	const isOpen = $derived(offer.status === 'pending' || offer.status === 'countered');
	const statusClass = $derived(
		offer.status === 'accepted'
			? 'text-emerald-400'
			: offer.status === 'declined' || offer.status === 'cancelled' || offer.status === 'expired'
				? 'text-destructive'
				: 'text-primary'
	);

	function formattedDate(value: string) {
		return new Date(value).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'short'
		});
	}

	function formattedDateTime(value: string) {
		return new Date(value).toLocaleString('fr-FR', {
			dateStyle: 'short',
			timeStyle: 'short'
		});
	}
</script>

<article
	class="min-w-0 border border-primary/20 bg-card/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-colors hover:border-primary/45 sm:p-4"
>
	<header class="flex min-w-0 items-start justify-between gap-3">
		<div class="min-w-0">
			<div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
				<h2 class="break-words text-base font-bold text-foreground sm:text-lg">
					{isIncoming
						? $_('trades.from', { values: { user: counterpartName } })
						: $_('trades.to', { values: { user: counterpartName } })}
				</h2>
				<span class={`font-mono text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
					· {$_(`trades.status.${offer.status}`)}
				</span>
			</div>
			<p class="mt-1 truncate text-xs text-muted-foreground">@{counterpart.username}</p>
		</div>
		<div class="flex shrink-0 items-center gap-1 sm:gap-2">
			<time class="hidden font-mono text-[9px] uppercase text-muted-foreground sm:block">
				{formattedDate(offer.createdAt)}
			</time>
			<button
				type="button"
				class="grid size-11 place-items-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
				aria-label={$_('trades.message_user', { values: { user: counterpartName } })}
				title={$_('trades.message_user', { values: { user: counterpartName } })}
				onclick={() => onMessage(counterpart.id)}
			>
				<MessageCircleIcon class="size-4" />
			</button>
		</div>
	</header>
	{#if offer.message}
		<p class="mt-3 border-l-2 border-primary/35 pl-3 text-sm italic text-muted-foreground">
			{offer.message}
		</p>
	{/if}
	{#if isOpen && offer.expiresAt}
		<p class="mt-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
			{$_('trades.expires_on', { values: { date: formattedDateTime(offer.expiresAt) } })}
		</p>
	{/if}

	<button
		type="button"
		class="mt-3 grid w-full min-w-0 cursor-pointer items-stretch gap-3 text-left focus-visible:outline-2 focus-visible:outline-primary lg:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] lg:gap-4"
		onclick={() => onView(offer)}
		aria-label={$_('trades.open_details')}
	>
		<section class="min-w-0">
			<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{$_('trades.user_offers', { values: { user: initiatorName } })}
			</p>
			<div class="mt-2 flex min-h-7 flex-wrap content-start gap-x-4 gap-y-2">
				<strong class="font-mono text-xs text-primary">
					{$_('trades.money_amount', { values: { amount: offer.offeredMoney ?? 0 } })}
				</strong>
				{#each offeredCards as entry (entry.userCardId)}
					<span
						class="max-w-full truncate font-mono text-[10px] font-bold sm:text-xs"
						style={`color:${entry.card.rarityColor}`}
					>
						{entry.card.rarityInitials} · {entry.card.title}
					</span>
				{/each}
				{#if !offeredCards.length && offer.offeredCardIds.length}
					<span class="font-mono text-[10px] uppercase text-muted-foreground">
						{$_('trades.cardCount', { values: { count: offer.offeredCardIds.length } })}
					</span>
				{:else if !offeredCards.length}
					<span class="font-mono text-[10px] uppercase text-muted-foreground"
						>{$_('trades.nothing')}</span
					>
				{/if}
			</div>
		</section>

		<div class="grid place-items-center text-muted-foreground/65" aria-hidden="true">
			<ArrowLeftRightIcon class="size-4 rotate-90 lg:rotate-0" />
		</div>

		<section class="min-w-0">
			<p class="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				{$_('trades.in_exchange')}
			</p>
			<div class="mt-2 flex min-h-7 flex-wrap content-start gap-x-4 gap-y-2">
				<strong class="font-mono text-xs text-primary">
					{$_('trades.money_amount', { values: { amount: offer.requestedMoney ?? 0 } })}
				</strong>
				{#each requestedCards as entry (entry.userCardId)}
					<span
						class="max-w-full truncate font-mono text-[10px] font-bold sm:text-xs"
						style={`color:${entry.card.rarityColor}`}
					>
						{entry.card.rarityInitials} · {entry.card.title}
					</span>
				{/each}
				{#if !requestedCards.length && offer.requestedCardIds.length}
					<span class="font-mono text-[10px] uppercase text-muted-foreground">
						{$_('trades.cardCount', { values: { count: offer.requestedCardIds.length } })}
					</span>
				{:else if !requestedCards.length}
					<span class="font-mono text-[10px] uppercase text-muted-foreground"
						>{$_('trades.nothing')}</span
					>
				{/if}
			</div>
		</section>
	</button>

	{#if isIncoming && isOpen}
		<footer
			class="mt-4 grid grid-cols-1 gap-2 border-t border-primary/10 pt-3 sm:flex sm:flex-wrap"
		>
			<Button size="sm" class="w-full sm:w-auto" onclick={() => onRespond(offer.id, 'accepted')}>
				<CheckIcon class="size-4" />
				{$_('trades.accept')}
			</Button>
			<Button
				size="sm"
				variant="outline"
				class="w-full sm:w-auto"
				onclick={() => onCounterOffer(offer)}
			>
				<Undo2Icon class="size-4" />
				{$_('trades.counter_offer')}
			</Button>
			<Button
				size="sm"
				variant="destructive"
				class="w-full sm:w-auto"
				onclick={() => onRespond(offer.id, 'declined')}
			>
				<XIcon class="size-4" />
				{$_('trades.reject')}
			</Button>
		</footer>
	{/if}
</article>
