<script lang="ts">
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import TradeOfferCard from './trade-offer-card.svelte';
	import type { TradeCardDetail, TradeOffer } from '$lib/types';

	let {
		offers,
		cardsByOffer,
		currentUserId,
		onTabChange,
		onRespond,
		onView,
		onCounterOffer
	}: {
		offers: TradeOffer[];
		cardsByOffer: ReadonlyMap<string, TradeCardDetail[]>;
		currentUserId: string;
		onTabChange: (tab: LedgerTab) => void;
		onRespond: (id: string, status: 'accepted' | 'rejected') => void;
		onView: (offer: TradeOffer) => void;
		onCounterOffer: (offer: TradeOffer) => void;
	} = $props();
	type LedgerTab = 'received' | 'sent' | 'history';
	let activeTab = $state<LedgerTab>('received');
	const visibleOffers = $derived(
		offers.filter((offer) => {
			if (activeTab === 'received')
				return offer.recipientId === currentUserId && offer.status === 'pending';
			if (activeTab === 'sent')
				return offer.initiatorId === currentUserId && offer.status === 'pending';
			return offer.status !== 'pending';
		})
	);
</script>

<div
	class="border-b border-dashed border-primary/30 pb-3"
	role="tablist"
	aria-label={$_('trades.tabs_aria')}
>
	<div class="grid grid-cols-3 gap-1 sm:max-w-xl">
		{#each ['received', 'sent', 'history'] as tab (tab)}
			<Button
				variant={activeTab === tab ? 'default' : 'outline'}
				size="sm"
				role="tab"
				aria-selected={activeTab === tab}
				onclick={() => {
					activeTab = tab as LedgerTab;
					onTabChange(activeTab);
				}}>{$_(`trades.tabs.${tab}`)}</Button
			>
		{/each}
	</div>
</div>

{#if visibleOffers.length}
	<div class="grid gap-3">
		{#each visibleOffers as offer (offer.id)}<TradeOfferCard
				{offer}
				cards={cardsByOffer.get(offer.id) ?? []}
				{currentUserId}
				{onRespond}
				{onView}
				{onCounterOffer}
			/>{/each}
	</div>
{:else}
	<p class="border border-primary/25 bg-card p-5 font-serif italic text-muted-foreground">
		{$_(`trades.empty_${activeTab}`)}
	</p>
{/if}
