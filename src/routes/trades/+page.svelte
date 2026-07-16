<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { _ } from '$lib/i18n';
	import { currentSession } from '$lib/auth/session';
	import {
		cancelTradeOffer,
		createTradeOffer,
		getTradeOffers,
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
		TradeOffer,
		TradeParticipant,
		User
	} from '$lib/types';

	let offers = $state<TradeOffer[]>([]);
	let tradeCards = $state<CardRecord[]>([]);
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

	onMount(async () => {
		currentUserId = $currentSession?.user.id ?? 'demo-user';
		try {
			const [ledger, ownCollection, tradePartners] = await Promise.all([
				getTradeOffers(currentUserId),
				getUserCollection(currentUserId),
				getTradePartners(currentUserId)
			]);
			offers = ledger;
			ownedCards = ownCollection;
			collectionsByUser.set(currentUserId, Promise.resolve(ownCollection));
			tradeCards = ownCollection;
			partners = tradePartners;
			loading = false;
			const counterpartIds = [
				...new Set(
					ledger
						.flatMap((offer) => [offer.initiatorId, offer.recipientId])
						.filter((id) => id !== currentUserId)
				)
			];
			void Promise.all(counterpartIds.map((id) => loadParticipantCollection(id)));

			const partnerId = page.url.searchParams.get('partner');
			const cardIds = (
				page.url.searchParams.get('cards') ??
				page.url.searchParams.get('card') ??
				''
			)
				.split(',')
				.filter(Boolean);
			const requestedPartner = tradePartners.find((partner) => partner.id === partnerId);
			if (requestedPartner && cardIds.length) await selectPartner(requestedPartner, cardIds);
		} finally {
			loading = false;
		}
	});

	function mergeTradeCards(collection: CardRecord[]) {
		tradeCards = [
			...new Map([...tradeCards, ...collection].map((card) => [card.id, card])).values()
		];
	}

	async function loadParticipantCollection(userId: string) {
		const cached = collectionsByUser.get(userId);
		if (cached) return cached;
		const request = getUserCollection(userId)
			.catch(() => [])
			.then((collection) => {
				mergeTradeCards(collection);
				return collection;
			});
		collectionsByUser.set(userId, request);
		return request;
	}

	async function selectPartner(partner: User, requestedCatalogueIds: string[] = []) {
		selectedPartner = partner;
		partnerCards = await loadParticipantCollection(partner.id);
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
		const [initiatorCollection, recipientCollection] = await Promise.all([
			loadParticipantCollection(offer.initiatorId),
			loadParticipantCollection(offer.recipientId)
		]);
		const initiatorCardsById = new Map(initiatorCollection.map((card) => [card.id, card]));
		const recipientCardsById = new Map(recipientCollection.map((card) => [card.id, card]));
		selectedOfferedCards = offer.offeredCardIds
			.map((id) => initiatorCardsById.get(id))
			.filter((card): card is CardRecord => Boolean(card));
		selectedRequestedCards = offer.requestedCardIds
			.map((id) => recipientCardsById.get(id))
			.filter((card): card is CardRecord => Boolean(card));
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
					partnerPickerOpen = true;
				}}>{$_('trades.create_offer')}</Button
			>
		{/snippet}
	</PageHeader>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('trades.loading')}
		</p>{:else}<TradeLedger
			{offers}
			cards={tradeCards}
			{currentUserId}
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
