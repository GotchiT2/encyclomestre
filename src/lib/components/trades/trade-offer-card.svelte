<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type { TradeOffer } from '$lib/types';

	let {
		offer,
		currentUserId,
		onRespond,
		onView,
		onCounterOffer
	}: {
		offer: TradeOffer;
		currentUserId: string;
		onRespond: (id: string, status: 'accepted' | 'rejected') => void;
		onView: (offer: TradeOffer) => void;
		onCounterOffer: (offer: TradeOffer) => void;
	} = $props();

	const isIncoming = $derived(offer.recipientId === currentUserId);
	const counterpart = $derived(isIncoming ? offer.initiator : offer.recipient);
	const counterpartName = $derived(
		counterpart.displayName.trim() || counterpart.username || counterpart.id
	);
	const statusClass = $derived(
		offer.status === 'accepted'
			? 'border-emerald-500/50 text-emerald-400'
			: offer.status === 'rejected'
				? 'border-destructive/50 text-destructive'
				: 'border-primary/50 text-primary'
	);
</script>

<article
	class="min-w-0 border border-primary/25 bg-card p-3 transition-colors hover:border-primary/60 sm:p-4"
>
	<button type="button" class="block w-full cursor-pointer text-left" onclick={() => onView(offer)}>
		<header
			class="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-primary/20 pb-3"
		>
			<div class="min-w-0">
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{isIncoming ? $_('trades.incoming') : $_('trades.outgoing')}
				</p>
				<h2
					class="mt-1 break-words font-serif text-lg font-black uppercase tracking-tight sm:text-xl"
				>
					{isIncoming
						? $_('trades.from', { values: { user: counterpartName } })
						: $_('trades.to', { values: { user: counterpartName } })}
				</h2>
				<p class="mt-1 truncate text-xs text-muted-foreground">@{counterpart.username}</p>
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
					{#if offer.offeredCardIds.length}<span
							class="border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
							>{$_('trades.cardCount', { values: { count: offer.offeredCardIds.length } })}</span
						>{/if}{#if offer.offeredCredits > 0}<span
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
					{#if offer.requestedCardIds.length}<span
							class="border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
							>{$_('trades.cardCount', { values: { count: offer.requestedCardIds.length } })}</span
						>{/if}{#if offer.requestedCredits > 0}<span
							class="border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
							>{offer.requestedCredits} {$_('trades.credit_chip')}</span
						>{/if}
				</div>
			</div>
		</div>
	</button>
	{#if isIncoming && offer.status === 'pending'}<footer
			class="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap"
		>
			<Button
				size="sm"
				class="w-full sm:w-auto"
				onclick={(event) => {
					event.stopPropagation();
					onRespond(offer.id, 'accepted');
				}}>{$_('trades.accept')}</Button
			><Button
				size="sm"
				variant="outline"
				class="w-full sm:w-auto"
				onclick={(event) => {
					event.stopPropagation();
					onCounterOffer(offer);
				}}>{$_('trades.counter_offer')}</Button
			><Button
				size="sm"
				variant="destructive"
				class="w-full sm:w-auto"
				onclick={(event) => {
					event.stopPropagation();
					onRespond(offer.id, 'rejected');
				}}>{$_('trades.reject')}</Button
			>
		</footer>{/if}
</article>
