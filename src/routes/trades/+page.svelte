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
	<header
		class="flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-primary/30 pb-6"
	>
		<div>
			<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
				{$_('trades.eyebrow')}
			</p>
			<h1
				class="mt-3 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
			>
				{$_('trades.title')}
			</h1>
			<p class="mt-3 max-w-2xl font-serif italic leading-relaxed text-muted-foreground">
				{$_('trades.description')}
			</p>
		</div>
		<Button
			onclick={() => {
				editorDraft = {};
				selectedPartner = null;
				partnerPickerOpen = true;
			}}>{$_('trades.create_offer')}</Button
		>
	</header>
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
