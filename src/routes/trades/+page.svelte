<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- the conversation id is appended to a resolved route */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { _ } from '$lib/i18n';
	import { toast } from 'svelte-sonner';
	import { operationError } from '$lib/domain/operation-error';
	import {
		realtimeRefresh,
		refreshIncludes,
		publishRealtimeRefresh
	} from '$lib/realtime/resource-refresh';
	import { currentSession, persistSession } from '$lib/auth/session';
	import {
		acceptTradeOfferWithRetry,
		cancelTradeOffer,
		counterTradeOffer,
		createTradeOffer,
		getFriendCollectionPage,
		getCurrentUserMoney,
		getTradeOffer,
		getTradeRegistry,
		getTradePartners,
		getWikiForgeCollectionPage,
		getWikiForgeCollectionCard,
		getWikiForgePublicPage,
		respondToTradeOffer,
		searchUsers
	} from '$lib/api';
	import TradeDetail from '$lib/components/trades/trade-detail.svelte';
	import TradeEditor from '$lib/components/trades/trade-editor.svelte';
	import TradePartnerPicker from '$lib/components/trades/trade-partner-picker.svelte';
	import TradeLedger from '$lib/components/trades/trade-ledger.svelte';
	import MarketNavigation from '$lib/components/market/market-navigation.svelte';
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

	let historyCount = $state(20);
	let offers = $state<TradeOffer[]>([]);
	let ownedCards = $state<CardRecord[]>([]);
	let partnerCards = $state<CardRecord[]>([]);
	let partners = $state<User[]>([]);
	let loading = $state(true);
	let loadFailed = $state(false);
	let currentUserId = $state('demo-user');
	const currentUserMoney = $derived($currentSession?.user.money ?? 0);
	let editorOpen = $state(false);
	let partnerPickerOpen = $state(false);
	let selectedPartner = $state<User | null>(null);
	let detailOpen = $state(false);
	let selectedOffer = $state<TradeOffer | null>(null);
	let selectedOfferedCards = $state<CardRecord[]>([]);
	let selectedRequestedCards = $state<CardRecord[]>([]);
	let selectedRemovedCardIds = $state<string[]>([]);
	let editorDraft = $state<Partial<CreateTradeOfferInput>>({});
	let counteringOfferId = $state<string | null>(null);
	let partnersRequest: Promise<User[]> | null = null;
	let tradesReady = $state(false);
	let handledRealtimeRevision = 0;
	const tradeCardsByOffer = new SvelteMap<string, TradeCardDetail[]>();

	onMount(async () => {
		currentUserId = $currentSession?.user.id ?? 'demo-user';
		try {
			await loadTrades();

			const partnerId = page.url.searchParams.get('partner');
			const cardIds = (
				page.url.searchParams.get('cards') ??
				page.url.searchParams.get('card') ??
				''
			)
				.split(',')
				.filter(Boolean);
			const requestedPageId = page.url.searchParams.get('requestedPageId');
			const requestedVariantId =
				Number(page.url.searchParams.get('requestedVariantId')) || undefined;
			const offeredCardIds = (page.url.searchParams.get('offerCards') ?? '')
				.split(',')
				.filter(Boolean);
			const requestedCatalogueIds = requestedPageId ? [requestedPageId] : cardIds;
			if (partnerId && (requestedCatalogueIds.length || offeredCardIds.length)) {
				const tradePartners = await loadPartners();
				const requestedPartner = tradePartners.find((partner) => partner.id === partnerId);
				if (requestedPartner)
					await selectPartner(
						requestedPartner,
						requestedCatalogueIds,
						offeredCardIds,
						requestedVariantId
					);
			}
		} catch {
			loadFailed = true;
		} finally {
			loading = false;
			tradesReady = true;
		}
	});

	$effect(() => {
		const refresh = $realtimeRefresh;
		if (
			!tradesReady ||
			refresh.revision === handledRealtimeRevision ||
			!refreshIncludes(refresh, 'trades')
		)
			return;
		handledRealtimeRevision = refresh.revision;
		void loadTrades().catch(() => undefined);
	});

	async function loadTrades() {
		try {
			const registry = await getTradeRegistry(historyCount);
			const result = [...registry.received, ...registry.sent, ...registry.done];
			offers = result;
			result.forEach((offer) => tradeCardsByOffer.set(offer.id, offer.cards ?? []));
			loadFailed = false;
			return result;
		} catch (error) {
			loadFailed = true;
			throw error;
		}
	}

	async function retryTrades() {
		loading = true;
		try {
			await loadTrades();
		} catch {
			// The visible error state remains active until a later successful retry.
		} finally {
			loading = false;
		}
	}

	async function loadPartners() {
		if (partnersRequest) return partnersRequest;
		partnersRequest = getTradePartners(currentUserId)
			.then((result) => {
				partners = result;
				return result;
			})
			.catch((cause) => {
				partnersRequest = null;
				throw cause;
			});
		return partnersRequest;
	}

	async function selectPartner(
		partner: User,
		requestedCatalogueIds: string[] = [],
		offeredUserCardIds: string[] = [],
		requestedVariantId?: number
	) {
		selectedPartner = partner;
		counteringOfferId = null;
		ownedCards = [];
		partnerCards = [];
		editorDraft = { recipientId: partner.id, offeredCardIds: [], requestedCardIds: [] };
		try {
			if (requestedCatalogueIds.length || offeredUserCardIds.length) {
				const [ownSelection, requestedSelection] = await Promise.all([
					Promise.all(offeredUserCardIds.slice(0, 20).map((id) => getWikiForgeCollectionCard(id))),
					Promise.all(
						requestedCatalogueIds.slice(0, 20).map(async (id) => {
							const article = await getWikiForgePublicPage(id);
							const result = await getFriendCollectionPage(partner.id, {
								query: article.title,
								variantIds: requestedVariantId ? [requestedVariantId] : []
							});
							return result.items.find(
								(card) =>
									String(card.catalogueId ?? card.baseCardId) === id &&
									(!requestedVariantId || card.variantId === requestedVariantId) &&
									!card.userProtected &&
									!card.pendingTradeId &&
									!card.activeAuctionId
							);
						})
					)
				]);
				ownedCards = ownSelection.filter(
					(card) => !card.userProtected && !card.pendingTradeId && !card.activeAuctionId
				);
				partnerCards = requestedSelection.filter((card): card is CardRecord => Boolean(card));
				editorDraft = {
					recipientId: partner.id,
					offeredCardIds: ownedCards.map((card) => card.id),
					requestedCardIds: partnerCards.map((card) => card.id)
				};
			}
			editorOpen = true;
		} catch (cause) {
			toast.error(operationError(cause));
		}
	}

	async function openPartnerPicker() {
		try {
			await loadPartners();
			partnerPickerOpen = true;
		} catch (cause) {
			toast.error(operationError(cause));
		}
	}

	async function loadOwnedTradeCards(query: import('$lib/types').TradeCardSearchQuery) {
		const result = await getWikiForgeCollectionPage({
			query: query?.query,
			sortBy: query?.sortBy === 'name' ? 'name' : 'acquiredDate',
			variantIds: query?.variantIds,
			page: query?.cursor ? undefined : Math.max(0, (query?.page ?? 1) - 1),
			cursor: query?.cursor
		});
		const pageNumber = result.page + 1;
		return {
			items: result.items,
			meta: {
				hasNext: result.hasNext,
				page: pageNumber,
				pageSize: query?.pageSize ?? Math.max(1, result.items.length),
				total: result.total < 0 ? result.items.length : result.total,
				totalPages:
					result.total < 0
						? pageNumber + (result.hasNext ? 1 : 0)
						: Math.max(1, Math.ceil(result.total / Math.max(1, query?.pageSize ?? 12))),
				nextCursor: result.nextCursor ?? undefined
			}
		};
	}

	async function loadPartnerTradeCards(query: import('$lib/types').TradeCardSearchQuery) {
		if (!selectedPartner) {
			return Promise.resolve({
				items: [],
				meta: { page: 1, pageSize: query?.pageSize ?? 12, total: 0, totalPages: 1 }
			});
		}
		const result = await getFriendCollectionPage(selectedPartner.id, {
			query: query.query,
			sortBy: query.sortBy === 'name' ? 'name' : 'acquiredDate',
			variantIds: query.variantIds,
			page: query.cursor ? undefined : Math.max(0, (query.page ?? 1) - 1),
			cursor: query.cursor
		});
		const pageNumber = result.page + 1;
		return {
			items: result.items,
			meta: {
				hasNext: result.hasNext,
				page: pageNumber,
				pageSize: Math.max(1, result.items.length),
				total: result.total < 0 ? result.items.length : result.total,
				totalPages: result.hasNext ? pageNumber + 1 : pageNumber,
				nextCursor: result.nextCursor ?? undefined
			}
		};
	}

	function participantAsUser(participant: TradeParticipant): User {
		return {
			...participant,
			role: 'user',
			createdAt: '',
			updatedAt: ''
		};
	}

	async function respond(id: string, status: 'accepted' | 'declined') {
		const updated =
			status === 'accepted'
				? await acceptTradeOfferWithRetry(id)
				: await respondToTradeOffer(id, status);
		tradeCardsByOffer.set(id, updated.cards ?? tradeCardsByOffer.get(id) ?? []);
		offers = offers.map((offer) => (offer.id === id ? updated : offer));
		if (selectedOffer?.id === id) selectedOffer = updated;
		if (status === 'accepted') {
			const [, , money] = await Promise.all([
				loadTrades(),
				getWikiForgeCollectionPage(),
				getCurrentUserMoney()
			]);
			const session = $currentSession;
			if (session) {
				persistSession(localStorage, {
					...session,
					user: { ...session.user, money }
				});
			}
		}
	}

	async function submitOffer(input: CreateTradeOfferInput) {
		const created = counteringOfferId
			? await counterTradeOffer(counteringOfferId, input)
			: await createTradeOffer(input);
		tradeCardsByOffer.set(created.id, created.cards ?? []);
		if (counteringOfferId) await loadTrades().catch(() => undefined);
		else offers = [created, ...offers];
		publishRealtimeRefresh(['collection', 'messages']);
		counteringOfferId = null;
	}

	async function cancel(id: string) {
		const updated = await cancelTradeOffer(id);
		tradeCardsByOffer.set(id, updated.cards ?? tradeCardsByOffer.get(id) ?? []);
		offers = offers.map((offer) => (offer.id === id ? updated : offer));
		if (selectedOffer?.id === id) selectedOffer = updated;
	}

	async function openCounterOffer(offer: TradeOffer) {
		counteringOfferId = offer.id;
		const counterpart = offer.initiatorId === currentUserId ? offer.recipient : offer.initiator;
		selectedPartner =
			partners.find((partner) => partner.id === counterpart.id) ?? participantAsUser(counterpart);
		const cards = tradeCardsByOffer.get(offer.id) ?? offer.cards ?? [];
		ownedCards = cards
			.filter((entry) => entry.side === 'requested' && entry.status === 'added')
			.map((entry) => entry.card);
		partnerCards = cards
			.filter((entry) => entry.side === 'offered' && entry.status === 'added')
			.map((entry) => entry.card);
		editorDraft = {
			recipientId: selectedPartner.id,
			offeredCardIds: offer.requestedCardIds,
			requestedCardIds: offer.offeredCardIds,
			message: offer.message,
			offeredMoney: offer.requestedMoney ?? 0,
			requestedMoney: offer.offeredMoney ?? 0
		};
		detailOpen = false;
		editorOpen = true;
	}

	async function openTradeDetail(offer: TradeOffer) {
		let currentOffer = offer;
		try {
			currentOffer = await getTradeOffer(offer.id);
			tradeCardsByOffer.set(offer.id, currentOffer.cards ?? []);
			offers = offers.map((entry) => (entry.id === offer.id ? currentOffer : entry));
		} catch {
			// The list payload remains usable if the dedicated detail request is temporarily unavailable.
		}
		const tradeCards = tradeCardsByOffer.get(offer.id) ?? currentOffer.cards ?? [];
		selectedOfferedCards = tradeCards
			.filter((entry) => entry.side === 'offered')
			.map((entry) => entry.card);
		selectedRequestedCards = tradeCards
			.filter((entry) => entry.side === 'requested')
			.map((entry) => entry.card);
		selectedRemovedCardIds = tradeCards
			.filter((entry) => entry.status === 'removed')
			.map((entry) => entry.card.id);
		selectedOffer = currentOffer;
		detailOpen = true;
	}

	async function openMessage(participantId: string) {
		await goto(`${resolve('/messages')}?user=${encodeURIComponent(participantId)}`);
	}
</script>

<section class="flex flex-col gap-6 sm:gap-8">
	<label class="flex flex-wrap items-center gap-3"
		>{$_('completion.historyCount')}<select
			class="min-h-11 border border-border bg-background px-3"
			bind:value={historyCount}
			onchange={() => void retryTrades()}
			>{#each [10, 20, 50] as count (count)}<option value={count}>{count}</option>{/each}</select
		></label
	>
	<MarketNavigation />
	<PageHeader
		eyebrow={$_('trades.eyebrow')}
		title={$_('trades.title')}
		description={$_('trades.description')}
	>
		{#snippet actions()}
			<Button
				onclick={() => {
					editorDraft = {};
					counteringOfferId = null;
					selectedPartner = null;
					ownedCards = [];
					partnerCards = [];
					void openPartnerPicker();
				}}>{$_('trades.create_offer')}</Button
			>
		{/snippet}
	</PageHeader>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('trades.loading')}
		</p>{:else if loadFailed}<div class="border border-destructive/40 bg-destructive/10 p-5">
			<p class="text-sm text-destructive">{$_('trades.load_error')}</p>
			<Button class="mt-3" variant="outline" onclick={() => void retryTrades()}>
				{$_('common.retry')}
			</Button>
		</div>{:else}<TradeLedger
			{offers}
			cardsByOffer={tradeCardsByOffer}
			{currentUserId}
			onTabChange={() => undefined}
			onRespond={respond}
			onCounterOffer={openCounterOffer}
			onView={(offer) => void openTradeDetail(offer)}
			onMessage={(participantId) => void openMessage(participantId)}
		/>{/if}
</section>

<TradePartnerPicker
	bind:open={partnerPickerOpen}
	{partners}
	searchPartners={(query) => searchUsers(query)}
	onSelect={(partner) => void selectPartner(partner)}
/>
<TradeEditor
	bind:open={editorOpen}
	{currentUserId}
	availableMoney={currentUserMoney}
	partner={selectedPartner}
	initialOwnedCards={ownedCards}
	initialPartnerCards={partnerCards}
	loadOwnedCards={loadOwnedTradeCards}
	loadPartnerCards={loadPartnerTradeCards}
	bind:draft={editorDraft}
	onSubmit={submitOffer}
/>
<TradeDetail
	bind:open={detailOpen}
	offer={selectedOffer}
	offeredCards={selectedOfferedCards}
	requestedCards={selectedRequestedCards}
	removedCardIds={selectedRemovedCardIds}
	{currentUserId}
	onCounterOffer={openCounterOffer}
	onRespond={respond}
	onCancel={cancel}
/>
