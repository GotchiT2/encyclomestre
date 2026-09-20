<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import CardActions from './card-actions.svelte';
	import CardTagControls from './card-tag-controls.svelte';
	import CardTelemetry from './card-telemetry.svelte';
	import FriendOwnerLedger from '$lib/components/social/friend-owner-ledger.svelte';
	import TradeEditor from '$lib/components/trades/trade-editor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog } from 'bits-ui';
	import { _ } from '$lib/i18n';
	import {
		createTradeOffer,
		getFriendCollectionPage,
		getWikiForgeCollectionCard,
		getWikiForgeCollectionPage
	} from '$lib/api';
	import { currentSession } from '$lib/auth/session';
	import { toast } from 'svelte-sonner';
	import XIcon from '@lucide/svelte/icons/x';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import { createModalLayer } from '$lib/components/ui/dialog/modal-layer';
	import type {
		CardRecord,
		CollectionTag,
		CollectionTagAssignments,
		CreateTradeOfferInput,
		PaginatedResponse,
		TradeCardSearchQuery,
		User,
		WishlistRegistrySummary
	} from '$lib/types';

	let {
		card,
		owned = false,
		wishlists = [],
		tags = $bindable<CollectionTag[]>([]),
		assignments = $bindable<CollectionTagAssignments>({}),
		onToggleWishlist,
		onToggleProtection,
		onClose
	}: {
		card: CardRecord;
		owned?: boolean;
		wishlists?: WishlistRegistrySummary[];
		tags?: CollectionTag[];
		assignments?: CollectionTagAssignments;
		onToggleWishlist: (wishlistId: string, selected: boolean) => void | Promise<void>;
		onToggleProtection?: () => void | Promise<void>;
		onClose: () => void;
	} = $props();

	const detailLayer = createModalLayer(100);
	let activeTab = $state<'data' | 'social'>('data');
	let tradeEditorOpen = $state(false);
	let tradePartner = $state<User | null>(null);
	let tradePartnerCards = $state<CardRecord[]>([]);
	let tradeDraft = $state<Partial<CreateTradeOfferInput>>({});
	let sharedWishlistsLoading = $state(false);
	let sharedWishlistsCardId = $state<string | null>(null);
	let landscapePreview = $state(false);

	$effect(() => {
		if (!owned) return;
		const cardId = card.id;
		if (sharedWishlistsCardId === cardId) return;
		sharedWishlistsCardId = cardId;
		sharedWishlistsLoading = true;
		void getWikiForgeCollectionCard(cardId)
			.then((detail) => {
				if (card.id !== cardId) return;
				card = { ...card, sharedWishlistMemberships: detail.sharedWishlistMemberships };
			})
			.catch(() => undefined)
			.finally(() => {
				if (card.id === cardId) sharedWishlistsLoading = false;
			});
	});

	function asTradePage(
		result: Awaited<ReturnType<typeof getWikiForgeCollectionPage>>
	): PaginatedResponse<CardRecord> {
		const page = result.page + 1;
		const pageSize = Math.max(1, result.items.length);
		return {
			items: result.items,
			meta: {
				page,
				pageSize,
				total: result.total < 0 ? result.items.length : result.total,
				totalPages:
					result.total < 0
						? page + (result.hasNext ? 1 : 0)
						: Math.max(1, Math.ceil(result.total / pageSize)),
				...(result.nextCursor ? { nextCursor: result.nextCursor } : {})
			}
		};
	}

	async function loadOwnedTradeCards(query: TradeCardSearchQuery) {
		return asTradePage(
			await getWikiForgeCollectionPage({
				query: query.query,
				sortBy: query.sortBy === 'name' ? 'name' : 'acquiredDate',
				variantIds: query.variantIds,
				page: query.cursor ? undefined : query.page,
				cursor: query.cursor
			})
		);
	}

	async function loadPartnerTradeCards(query: TradeCardSearchQuery) {
		if (!tradePartner)
			return { items: [], meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 } };
		const result = await getFriendCollectionPage(tradePartner.id, {
			query: query.query,
			sortBy: query.sortBy === 'name' ? 'name' : 'acquiredDate',
			variantIds: query.variantIds,
			page: query.cursor ? undefined : query.page,
			cursor: query.cursor
		});
		return asTradePage(result);
	}

	async function startTrade(owner: CardRecord['friendsWhoOwn'][number]) {
		const requestedPageId = String(card.baseCardId ?? card.catalogueId ?? card.id);
		try {
			const result = await getFriendCollectionPage(owner.friendId, {
				variantIds: [card.variantId]
			});
			const requestedCard = result.items.find(
				(copy) =>
					String(copy.baseCardId ?? copy.catalogueId ?? copy.id) === requestedPageId &&
					copy.variantId === card.variantId
			);
			if (!requestedCard) {
				toast.error($_('cardDetail.trade_card_unavailable'));
				return;
			}
			tradePartner = {
				id: owner.friendId,
				username: owner.username,
				displayName: owner.username,
				avatarUrl: owner.avatarUrl ?? null,
				role: 'user',
				createdAt: '',
				updatedAt: ''
			};
			tradePartnerCards = [requestedCard];
			tradeDraft = { recipientId: owner.friendId, requestedCardIds: [requestedCard.id] };
			tradeEditorOpen = true;
		} catch {
			toast.error($_('cardDetail.trade_card_unavailable'));
		}
	}

	async function submitTrade(input: CreateTradeOfferInput) {
		try {
			await createTradeOffer(input);
			toast.success($_('trades.offer_sent'));
		} catch {
			toast.error($_('common.error'));
		}
	}
</script>

<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 bg-[rgb(1_5_10_/_88%)] backdrop-blur-sm"
			style={`z-index:${detailLayer}`}
			data-testid="card-detail-overlay"
		/>
		<Dialog.Content
			preventScroll={false}
			class="fixed inset-2 h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none overflow-hidden border border-primary/35 bg-card p-0 text-foreground shadow-2xl outline-none sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2.5rem)] sm:w-[calc(100%-2.5rem)] sm:max-w-screen-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-4"
			style={`z-index:${detailLayer + 1}`}
			data-testid="card-detail-modal"
		>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgb(25_167_170_/_13%),transparent_32rem)]"
			></div>
			<div class="relative flex h-full min-h-0 flex-col sm:h-auto sm:max-h-[calc(100dvh-4.5rem)]">
				<div
					class="z-10 flex shrink-0 justify-end border-b border-primary/15 bg-card/95 p-2 sm:absolute sm:top-0 sm:right-0 sm:border-0 sm:bg-transparent sm:p-0"
				>
					<Button
						size="icon"
						variant="outline"
						onclick={onClose}
						aria-label={$_('cardDetail.close')}><XIcon /></Button
					>
				</div>
				<section
					class="card-detail-layout relative grid min-h-0 flex-1 gap-3 overflow-y-auto overscroll-contain px-3 py-3 sm:gap-5 sm:p-0 lg:grid-cols-[minmax(18rem,0.48fr)_minmax(0,1fr)] xl:grid-cols-[minmax(21rem,0.52fr)_minmax(0,1fr)]"
					class:landscape-preview={landscapePreview}
				>
					<div class="card-detail-preview mx-auto w-fit lg:sticky lg:top-0 lg:self-start">
						<CardTile
							{card}
							stateIndicatorsOffset={10}
							tags={tags.filter((tag) => (assignments[card.id] ?? []).includes(tag.id))}
							showFriendOwners
							tagDisplay="full"
							onOrientationChange={(landscape) => (landscapePreview = landscape)}
						/>
					</div>
					<div class="flex min-h-0 min-w-0 flex-col gap-3">
						<header class="forge-divider pb-3 sm:pr-14">
							<p class="forge-label" style={`color:${card.variant.color}`}>
								{card.variant.name}
							</p>
							<Dialog.Title
								id="card-detail-modal-title"
								class="mt-1 font-serif text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
							>
								{card.title}
							</Dialog.Title>
							<p class="mt-2 max-w-3xl text-sm leading-snug text-muted-foreground">
								{card.longDescription}
							</p>
						</header>
						<div class="hidden sm:block">
							<CardActions
								card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
								{wishlists}
								{onToggleWishlist}
							/>
						</div>

						<div
							class="hidden gap-1 overflow-x-auto border-b border-primary/20 sm:flex"
							role="tablist"
							aria-label={$_('cardDetail.tabs')}
						>
							{#each [{ id: 'data', label: 'cardDetail.data' }, { id: 'social', label: 'cardDetail.social' }] as tab (tab.id)}
								<Button
									variant="ghost"
									class={activeTab === tab.id ? 'forge-nav-active' : ''}
									onclick={() => (activeTab = tab.id as typeof activeTab)}
									role="tab"
									aria-selected={activeTab === tab.id}>{$_(tab.label)}</Button
								>
							{/each}
						</div>

						<div class="forge-panel-flat p-3" data-testid="card-detail-tab-panel">
							{#if activeTab === 'data'}
								{#if owned}
									{#if onToggleProtection}
										<Button variant="outline" class="mb-3" onclick={onToggleProtection}>
											{#if card.userProtected}<LockOpenIcon />{$_('collection.unprotect')}
											{:else}<LockIcon />{$_('collection.protect')}{/if}
										</Button>
									{/if}
									<CardTagControls
										cardId={card.id}
										bind:tags
										bind:assignments
										onCardUpdated={(updated) => (card = updated)}
									/>
								{/if}
								<div class:mt-3={owned}><CardTelemetry {card} /></div>
								{#if card.imageAttribution}
									<p class="mt-3 text-xs text-muted-foreground">
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
										<a class="underline" href={card.imageAttribution.sourceUrl} target="_blank"
											>{card.imageAttribution.author ?? $_('codex.wikipedia')}</a
										>
										{#if card.imageAttribution.license}
											· {card.imageAttribution.license}{/if}
									</p>
								{/if}
								{#if card.wikipediaUrl}<Button href={card.wikipediaUrl} target="_blank" class="mt-3"
										>{$_('codex.wikipedia')}</Button
									>{/if}
							{:else}
								<FriendOwnerLedger
									friends={card.friendsWhoOwn}
									onPrepareTrade={(friend) => void startTrade(friend)}
								/>
								{#if sharedWishlistsLoading}
									<p class="mt-3 forge-label">{$_('cardState.shared_wishlists_loading')}</p>
								{:else if card.sharedWishlistMemberships?.length}
									<section class="mt-3 border-t border-energy/25 pt-3">
										<h3 class="forge-label text-energy">
											{$_('cardState.shared_wishlists_title')}
										</h3>
										<ul class="mt-2 grid gap-1">
											{#each card.sharedWishlistMemberships as wishlist (`${wishlist.userId}-${wishlist.id}`)}
												<li
													class="flex items-center justify-between gap-3 border border-energy/25 bg-background/40 px-2 py-1.5 text-sm"
												>
													<span class="truncate">{wishlist.title}</span><span
														class="shrink-0 text-muted-foreground">@{wishlist.userName}</span
													>
												</li>
											{/each}
										</ul>
									</section>
								{/if}
							{/if}
						</div>
					</div>
				</section>
				<div
					class="flex min-h-11 shrink-0 border-t border-b border-primary/25 bg-[rgb(8_15_25_/_98%)] sm:hidden"
					role="tablist"
					aria-label={$_('cardDetail.tabs')}
					data-testid="card-detail-mobile-tabs"
				>
					{#each [{ id: 'data', label: 'cardDetail.data' }, { id: 'social', label: 'cardDetail.social' }] as tab (tab.id)}
						<Button
							variant="ghost"
							class={`min-w-0 flex-1 px-2 ${activeTab === tab.id ? 'forge-nav-active' : ''}`}
							onclick={() => (activeTab = tab.id as typeof activeTab)}
							role="tab"
							aria-selected={activeTab === tab.id}>{$_(tab.label)}</Button
						>
					{/each}
				</div>
				<div
					class="min-h-[4.25rem] shrink-0 border-t border-primary/25 bg-[rgb(8_15_25_/_96%)] p-3 sm:hidden"
					data-testid="card-detail-mobile-actions"
				>
					<CardActions
						card={{ ...card, ownedCount: owned ? Math.max(1, card.ownedCount) : 0 }}
						{wishlists}
						{onToggleWishlist}
					/>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

{#if tradePartner}
	<TradeEditor
		bind:open={tradeEditorOpen}
		modalLayer={detailLayer + 20}
		currentUserId={$currentSession?.user.id ?? ''}
		availableMoney={$currentSession?.user.money ?? 0}
		partner={tradePartner}
		initialPartnerCards={tradePartnerCards}
		loadOwnedCards={loadOwnedTradeCards}
		loadPartnerCards={loadPartnerTradeCards}
		bind:draft={tradeDraft}
		onSubmit={(input) => void submitTrade(input)}
	/>
{/if}

<style>
	.card-detail-preview :global(.wikiforge-card-size) {
		width: 12rem;
	}
	.landscape-preview .card-detail-preview :global(.wikiforge-card-size) {
		width: min(100%, 28rem);
	}

	@media (min-width: 640px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 15rem;
		}
		.landscape-preview .card-detail-preview :global(.wikiforge-card-size) {
			width: min(28rem, calc(100vw - 5rem));
		}
	}

	@media (min-width: 1024px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 18rem;
		}
		.card-detail-layout.landscape-preview {
			grid-template-columns: minmax(28rem, 0.75fr) minmax(0, 1fr);
		}
		.landscape-preview .card-detail-preview :global(.wikiforge-card-size) {
			width: 28rem;
		}
	}

	@media (min-width: 1280px) {
		.card-detail-preview :global(.wikiforge-card-size) {
			width: 21rem;
		}
		.card-detail-layout.landscape-preview {
			grid-template-columns: minmax(34rem, 0.82fr) minmax(0, 1fr);
		}
		.landscape-preview .card-detail-preview :global(.wikiforge-card-size) {
			width: 34rem;
		}
	}
</style>
