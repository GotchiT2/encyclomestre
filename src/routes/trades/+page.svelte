<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import {
		cancelTradeOffer,
		createTradeOffer,
		getTradeOffers,
		getTradePartners,
		respondToTradeOffer
	} from '$lib/api';
	import TradeDetail from '$lib/components/trades/trade-detail.svelte';
	import TradeEditor from '$lib/components/trades/trade-editor.svelte';
	import TradePartnerPicker from '$lib/components/trades/trade-partner-picker.svelte';
	import TradeLedger from '$lib/components/trades/trade-ledger.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { CardRecord, CreateTradeOfferInput, TradeOffer, User } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let offers = $state<TradeOffer[]>([]);
	let cards = $state<CardRecord[]>([]);
	let ownedCards = $state<CardRecord[]>([]);
	let partners = $state<User[]>([]);
	let loading = $state(true);
	let currentUserId = $state('demo-user');
	let editorOpen = $state(false);
	let partnerPickerOpen = $state(false);
	let selectedPartner = $state<User | null>(null);
	let detailOpen = $state(false);
	let selectedOffer = $state<TradeOffer | null>(null);
	let editorDraft = $state<Partial<CreateTradeOfferInput>>({});

	onMount(async () => {
		currentUserId = $currentSession?.user.id ?? 'demo-user';
		const [ledger, catalogue, collection, tradePartners] = await Promise.all([
			getTradeOffers(currentUserId),
			data.cards,
			data.collection,
			getTradePartners(currentUserId)
		]);
		offers = ledger;
		cards = catalogue.items;
		ownedCards = collection.items;
		partners = tradePartners;
		const partnerId = page.url.searchParams.get('partner');
		const cardIds = (page.url.searchParams.get('cards') ?? page.url.searchParams.get('card') ?? '')
			.split(',')
			.filter(Boolean);
		const requestedPartner = tradePartners.find((partner) => partner.id === partnerId);
		if (requestedPartner && cardIds.length) {
			selectedPartner = requestedPartner;
			editorDraft = { recipientId: requestedPartner.id, requestedCardIds: cardIds };
			editorOpen = true;
		}
		loading = false;
	});

	async function respond(id: string, status: 'accepted' | 'rejected') {
		const updated = await respondToTradeOffer(id, status);
		offers = offers.map((offer) => (offer.id === id ? updated : offer));
		if (selectedOffer?.id === id) selectedOffer = updated;
	}

	async function submitOffer(input: CreateTradeOfferInput) {
		const created = await createTradeOffer(input);
		offers = [created, ...offers];
	}

	async function cancel(id: string) {
		const updated = await cancelTradeOffer(id);
		offers = offers.map((offer) => (offer.id === id ? updated : offer));
		if (selectedOffer?.id === id) selectedOffer = updated;
	}

	function openCounterOffer(offer: TradeOffer) {
		selectedPartner =
			partners.find(
				(partner) =>
					partner.id ===
					(offer.initiatorId === currentUserId ? offer.recipientId : offer.initiatorId)
			) ?? null;
		editorDraft = {
			recipientId: offer.initiatorId === currentUserId ? offer.recipientId : offer.initiatorId,
			offeredCardIds: offer.requestedCardIds,
			requestedCardIds: offer.offeredCardIds,
			offeredCredits: offer.requestedCredits,
			requestedCredits: offer.offeredCredits
		};
		detailOpen = false;
		editorOpen = true;
	}
</script>

<section class="flex flex-col gap-6 sm:gap-8">
	<PageHeader
		eyebrow={$_('trades.eyebrow')}
		title={$_('trades.title')}
		description={$_('trades.description')}
	>
		{#snippet actions()}
			<Button
				onclick={() => {
					editorDraft = {};
					selectedPartner = null;
					partnerPickerOpen = true;
				}}>{$_('trades.create_offer')}</Button
			>
		{/snippet}
	</PageHeader>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('trades.loading')}
		</p>{:else}<TradeLedger
			{offers}
			{cards}
			{currentUserId}
			onRespond={respond}
			onCounterOffer={openCounterOffer}
			onView={(offer) => {
				selectedOffer = offer;
				detailOpen = true;
			}}
		/>{/if}
</section>

<TradePartnerPicker
	bind:open={partnerPickerOpen}
	{partners}
	onSelect={(partner) => {
		selectedPartner = partner;
		editorOpen = true;
	}}
/>
<TradeEditor
	bind:open={editorOpen}
	{currentUserId}
	partner={selectedPartner}
	{ownedCards}
	{cards}
	bind:draft={editorDraft}
	onSubmit={submitOffer}
/>
<TradeDetail
	bind:open={detailOpen}
	offer={selectedOffer}
	{cards}
	{currentUserId}
	onCounterOffer={openCounterOffer}
	onRespond={respond}
	onCancel={cancel}
/>
