<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import {
		cancelTradeOffer,
		createTradeOffer,
		getReceivedTradeOffers,
		getSentTradeOffers,
		getTradeCards,
		getTradeHistory,
		getTradePartners,
		getUserCollection,
		respondToTradeOffer
	} from '$lib/api';
	import TradeDetail from '$lib/components/trades/trade-detail.svelte';
	import TradeEditor from '$lib/components/trades/trade-editor.svelte';
	import TradePartnerPicker from '$lib/components/trades/trade-partner-picker.svelte';
	import TradeLedger from '$lib/components/trades/trade-ledger.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import type {
		CardRecord,
		CreateTradeOfferInput,
		TradeCardDetail,
		TradeOffer,
		TradeParticipant,
		User
	} from '$lib/types';

	let offers = $state<TradeOffer[]>([]);
	let ownedCards = $state<CardRecord[]>([]);
	let partnerCards = $state<CardRecord[]>([]);
	let partners = $state<User[]>([]);
	let loading = $state(true);
	let currentUserId = $state('demo-user');
	let editorOpen = $state(false);
	let partnerPickerOpen = $state(false);
	let selectedPartner = $state<User | null>(null);
	let detailOpen = $state(false);
	let selectedOffer = $state<TradeOffer | null>(null);
	let selectedOfferedCards = $state<CardRecord[]>([]);
	let selectedRequestedCards = $state<CardRecord[]>([]);
	let editorDraft = $state<Partial<CreateTradeOfferInput>>({});
	const collectionsByUser = new SvelteMap<string, Promise<CardRecord[]>>();
	let ownedCardsRequest: Promise<CardRecord[]> | null = null;
	let partnersRequest: Promise<User[]> | null = null;
	type TradeTab = 'received' | 'sent' | 'history';
	const tradeRequests = new SvelteMap<TradeTab, Promise<TradeOffer[]>>();
	const tradeCardRequests = new SvelteMap<string, Promise<TradeCardDetail[]>>();
	const tradeCardsByOffer = new SvelteMap<string, TradeCardDetail[]>();

	onMount(async () => {
		currentUserId = $currentSession?.user.id ?? 'demo-user';
		try {
			await loadTradeTab('received');

			const partnerId = page.url.searchParams.get('partner');
			const cardIds = (
				page.url.searchParams.get('cards') ??
				page.url.searchParams.get('card') ??
				''
			)
				.split(',')
				.filter(Boolean);
			if (partnerId && cardIds.length) {
				const tradePartners = await loadPartners();
				const requestedPartner = tradePartners.find((partner) => partner.id === partnerId);
				if (requestedPartner) await selectPartner(requestedPartner, cardIds);
			}
		} finally {
			loading = false;
		}
	});

	async function loadTradeTab(tab: TradeTab) {
		const cached = tradeRequests.get(tab);
		if (cached) return cached;
		const request = (
			tab === 'received'
				? getReceivedTradeOffers()
				: tab === 'sent'
					? getSentTradeOffers()
					: getTradeHistory()
		).then(async (result) => {
			offers = [...new Map([...offers, ...result].map((offer) => [offer.id, offer])).values()];
			await Promise.all(result.map((offer) => loadTradeCards(offer.id).catch(() => [])));
			return result;
		});
		tradeRequests.set(tab, request);
		return request;
	}

	async function loadTradeCards(offerId: string) {
		let cardsRequest = tradeCardRequests.get(offerId);
		if (!cardsRequest) {
			cardsRequest = getTradeCards(offerId)
				.then((cards) => {
					tradeCardsByOffer.set(offerId, cards);
					return cards;
				})
				.catch((error) => {
					tradeCardRequests.delete(offerId);
					throw error;
				});
			tradeCardRequests.set(offerId, cardsRequest);
		}
		return cardsRequest;
	}

	async function loadOwnedCards() {
		if (ownedCardsRequest) return ownedCardsRequest;
		ownedCardsRequest = getUserCollection(currentUserId).then((collection) => {
			ownedCards = collection;
			collectionsByUser.set(currentUserId, Promise.resolve(collection));
			return collection;
		});
		return ownedCardsRequest;
	}

	async function loadPartners() {
		if (partnersRequest) return partnersRequest;
		partnersRequest = getTradePartners(currentUserId).then((result) => {
			partners = result;
			return result;
		});
		return partnersRequest;
	}

	async function loadParticipantCollection(userId: string) {
		const cached = collectionsByUser.get(userId);
		if (cached) return cached;
		const request = getUserCollection(userId).catch(() => []);
		collectionsByUser.set(userId, request);
		return request;
	}

	async function selectPartner(partner: User, requestedCatalogueIds: string[] = []) {
		selectedPartner = partner;
		const [, collection] = await Promise.all([
			loadOwnedCards(),
			loadParticipantCollection(partner.id)
		]);
		partnerCards = collection;
		if (requestedCatalogueIds.length) {
			editorDraft = {
				recipientId: partner.id,
				requestedCardIds: partnerCards
					.filter((card) => requestedCatalogueIds.includes(card.catalogueId ?? card.id))
					.map((card) => card.id)
			};
		}
		editorOpen = true;
	}

	async function openPartnerPicker() {
		await Promise.all([loadOwnedCards(), loadPartners()]);
		partnerPickerOpen = true;
	}

	function participantAsUser(participant: TradeParticipant): User {
		return {
			...participant,
			role: 'user',
			createdAt: '',
			updatedAt: ''
		};
	}

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

	async function openCounterOffer(offer: TradeOffer) {
		const counterpart = offer.initiatorId === currentUserId ? offer.recipient : offer.initiator;
		await Promise.all([loadOwnedCards(), loadPartners()]);
		selectedPartner =
			partners.find((partner) => partner.id === counterpart.id) ?? participantAsUser(counterpart);
		partnerCards = await loadParticipantCollection(selectedPartner.id);
		editorDraft = {
			recipientId: selectedPartner.id,
			offeredCardIds: offer.requestedCardIds,
			requestedCardIds: offer.offeredCardIds,
			offeredCredits: offer.requestedCredits,
			requestedCredits: offer.offeredCredits
		};
		detailOpen = false;
		editorOpen = true;
	}

	async function openTradeDetail(offer: TradeOffer) {
		const tradeCards = await loadTradeCards(offer.id);
		selectedOfferedCards = tradeCards
			.filter((entry) => entry.side === 'offered')
			.map((entry) => entry.card);
		selectedRequestedCards = tradeCards
			.filter((entry) => entry.side === 'requested')
			.map((entry) => entry.card);
		selectedOffer = offer;
		detailOpen = true;
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
					partnerCards = [];
					void openPartnerPicker();
				}}>{$_('trades.create_offer')}</Button
			>
		{/snippet}
	</PageHeader>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('trades.loading')}
		</p>{:else}<TradeLedger
			{offers}
			cardsByOffer={tradeCardsByOffer}
			{currentUserId}
			onTabChange={(tab) => void loadTradeTab(tab)}
			onRespond={respond}
			onCounterOffer={openCounterOffer}
			onView={(offer) => void openTradeDetail(offer)}
		/>{/if}
</section>

<TradePartnerPicker
	bind:open={partnerPickerOpen}
	{partners}
	onSelect={(partner) => void selectPartner(partner)}
/>
<TradeEditor
	bind:open={editorOpen}
	{currentUserId}
	partner={selectedPartner}
	{ownedCards}
	cards={partnerCards}
	bind:draft={editorDraft}
	onSubmit={submitOffer}
/>
<TradeDetail
	bind:open={detailOpen}
	offer={selectedOffer}
	offeredCards={selectedOfferedCards}
	requestedCards={selectedRequestedCards}
	{currentUserId}
	onCounterOffer={openCounterOffer}
	onRespond={respond}
	onCancel={cancel}
/>
