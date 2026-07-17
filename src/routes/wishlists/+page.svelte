<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- dynamic query parameters are appended to resolved routes */
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as currentPage } from '$app/state';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { currentSession } from '$lib/auth/session';
	import {
		addWishlistRegistryCard,
		createWishlistRegistry,
		deleteWishlistRegistry,
		getCards,
		getWishlistRegistryCards,
		getWishlists,
		importWishlistRegistryFromLink,
		removeWishlistRegistryCard,
		shareWishlistRegistry,
		updateWishlistRegistry
	} from '$lib/api';
	import WishlistHub from '$lib/components/wishlist/wishlist-hub.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import WishlistImport from '$lib/components/wishlist/wishlist-import.svelte';
	import WishlistOwnerSummary from '$lib/components/wishlist/wishlist-owner-summary.svelte';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import WishlistRegistryDrawers from '$lib/components/wishlist/wishlist-registry-drawers.svelte';
	import WishlistShareModal from '$lib/components/wishlist/wishlist-share-modal.svelte';
	import WishlistSocialGrid from '$lib/components/wishlist/wishlist-social-grid.svelte';
	import WishlistTradeDrawer from '$lib/components/wishlist/wishlist-trade-drawer.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { compareCardsByRarityDesc } from '$lib/domain/cards/rarities';
	import type {
		CardRecord,
		FriendOwnerInfo,
		WishlistRegistry,
		WishlistRegistrySummary
	} from '$lib/types';

	let userId = $state('demo-user');
	let registries = $state<WishlistRegistrySummary[]>([]);
	let activeRegistry = $state<WishlistRegistry | null>(null);
	let loading = $state(true);
	let pickerOpen = $state(false);
	let createOpen = $state(false);
	let editOpen = $state(false);
	let shareOpen = $state(false);
	let deleteOpen = $state(false);
	let deletingRegistry = $state<WishlistRegistrySummary | null>(null);
	let editingRegistry = $state<WishlistRegistrySummary | null>(null);
	let selectedCard = $state<CardRecord | null>(null);
	let tradeOpen = $state(false);
	let tradeCard = $state<CardRecord | null>(null);
	let tradeFriend = $state<FriendOwnerInfo | null>(null);
	let tradeCardIds = $state<string[]>([]);
	let sortBy = $state<'rarity' | 'date' | 'opportunity'>('rarity');
	let activeTab = $state<'cards' | 'owners'>('cards');
	const registryCardsById = new SvelteMap<string, Promise<CardRecord[]>>();

	const activeCards = $derived(
		(activeRegistry?.cards ?? []).toSorted((left, right) => {
			if (sortBy === 'opportunity') return right.friendsWhoOwn.length - left.friendsWhoOwn.length;
			if (sortBy === 'date')
				return (
					(activeRegistry?.cardIds.indexOf(right.id) ?? 0) -
					(activeRegistry?.cardIds.indexOf(left.id) ?? 0)
				);
			return compareCardsByRarityDesc(left, right);
		})
	);

	async function loadRegistry(id: string) {
		const summary = registries.find((registry) => registry.id === id);
		if (!summary) return null;
		let cardsRequest = registryCardsById.get(id);
		if (!cardsRequest) {
			cardsRequest = getWishlistRegistryCards(id).catch((error) => {
				registryCardsById.delete(id);
				throw error;
			});
			registryCardsById.set(id, cardsRequest);
		}
		const registryCards = await cardsRequest;
		return {
			...summary,
			cardIds: registryCards.map((card) => card.id),
			cards: registryCards
		} satisfies WishlistRegistry;
	}

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		const sharedToken = currentPage.url.searchParams.get('share');
		const imported = sharedToken ? await importWishlistRegistryFromLink(userId, sharedToken) : null;
		const summaries = await getWishlists(userId);
		registries = summaries;
		const requestedRegistryId = imported?.id ?? currentPage.url.searchParams.get('registry');
		const initialRegistry =
			summaries.find((registry) => registry.id === requestedRegistryId) ?? summaries[0];
		if (initialRegistry) activeRegistry = await loadRegistry(initialRegistry.id);
		loading = false;
	});

	async function selectRegistry(id: string) {
		activeRegistry = await loadRegistry(id);
	}

	async function refreshHub(selectedId = activeRegistry?.id) {
		registries = await getWishlists(userId);
		if (selectedId) activeRegistry = await loadRegistry(selectedId);
	}

	async function create(title: string, description: string, isPublic: boolean) {
		const created = await createWishlistRegistry(userId, { title, description, isPublic });
		await refreshHub(created.id);
	}

	async function updateRegistry(title: string, description: string, isPublic: boolean) {
		if (!editingRegistry) return;
		const updated = await updateWishlistRegistry(editingRegistry.id, {
			title,
			description,
			isPublic
		});
		registryCardsById.set(updated.id, Promise.resolve(activeRegistry?.cards ?? updated.cards));
		registries = registries.map((registry) => (registry.id === updated.id ? updated : registry));
		if (activeRegistry?.id === updated.id) {
			activeRegistry = { ...activeRegistry, ...updated, cards: activeRegistry.cards };
		}
		editingRegistry = null;
	}

	async function removeRegistry() {
		if (!deletingRegistry) return;
		const deletedId = deletingRegistry.id;
		await deleteWishlistRegistry(deletedId, userId);
		registryCardsById.delete(deletedId);
		registries = registries.filter((registry) => registry.id !== deletedId);
		deleteOpen = false;
		deletingRegistry = null;
		if (activeRegistry?.id === deletedId) {
			activeRegistry = registries[0] ? await loadRegistry(registries[0].id) : null;
		}
	}

	async function addCard(card: CardRecord) {
		if (!activeRegistry) return;
		await addWishlistRegistryCard(activeRegistry.id, userId, card.id);
		activeRegistry = {
			...activeRegistry,
			cardIds: [...new Set([...activeRegistry.cardIds, card.id])],
			cards: [
				...new Map([...activeRegistry.cards, card].map((entry) => [entry.id, entry])).values()
			]
		};
		registryCardsById.set(activeRegistry.id, Promise.resolve(activeRegistry.cards));
		registries = registries.map((registry) =>
			registry.id === activeRegistry?.id
				? { ...registry, cardIds: activeRegistry.cardIds, cards: activeRegistry.cards }
				: registry
		);
	}

	async function removeCard(cardId: string) {
		if (!activeRegistry) return;
		await removeWishlistRegistryCard(activeRegistry.id, userId, cardId);
		activeRegistry = {
			...activeRegistry,
			cardIds: activeRegistry.cardIds.filter((id) => id !== cardId),
			cards: activeRegistry.cards.filter((card) => card.id !== cardId)
		};
		registryCardsById.set(activeRegistry.id, Promise.resolve(activeRegistry.cards));
		registries = registries.map((registry) =>
			registry.id === activeRegistry?.id
				? { ...registry, cardIds: activeRegistry.cardIds, cards: activeRegistry.cards }
				: registry
		);
		if (selectedCard?.id === cardId) selectedCard = null;
	}

	async function toggleWishlist(wishlistId: string, card: CardRecord, selected: boolean) {
		if (selected) await addWishlistRegistryCard(wishlistId, userId, card.id);
		else await removeWishlistRegistryCard(wishlistId, userId, card.id);
		registries = registries.map((registry) =>
			registry.id === wishlistId
				? {
						...registry,
						cardIds: selected
							? [...new Set([...registry.cardIds, card.id])]
							: registry.cardIds.filter((id) => id !== card.id),
						cards: selected
							? [...new Map([...registry.cards, card].map((entry) => [entry.id, entry])).values()]
							: registry.cards.filter((entry) => entry.id !== card.id)
					}
				: registry
		);
		if (activeRegistry?.id === wishlistId) {
			activeRegistry = {
				...activeRegistry,
				cardIds: selected
					? [...new Set([...activeRegistry.cardIds, card.id])]
					: activeRegistry.cardIds.filter((id) => id !== card.id),
				cards: selected
					? [...new Map([...activeRegistry.cards, card].map((entry) => [entry.id, entry])).values()]
					: activeRegistry.cards.filter((entry) => entry.id !== card.id)
			};
			registryCardsById.set(wishlistId, Promise.resolve(activeRegistry.cards));
		}
	}

	function proposeTrade(card: CardRecord, friend: FriendOwnerInfo) {
		tradeCard = card;
		tradeFriend = friend;
		tradeCardIds = [card.id];
		tradeOpen = true;
	}

	function proposeGroupTrade(friend: FriendOwnerInfo, ownerCards: CardRecord[]) {
		tradeCard = ownerCards[0] ?? null;
		tradeFriend = friend;
		tradeCardIds = ownerCards.map((card) => card.id);
		tradeOpen = Boolean(tradeCard);
	}

	function confirmTrade() {
		if (!tradeCard || !tradeFriend) return;
		tradeOpen = false;
		goto(
			`${resolve('/trades')}?partner=${encodeURIComponent(tradeFriend.friendId)}&cards=${encodeURIComponent(tradeCardIds.join(','))}`
		);
	}

	async function shareLink() {
		if (!activeRegistry) return;
		const { sealUrl } = await shareWishlistRegistry(activeRegistry.id, userId);
		await navigator.clipboard?.writeText(sealUrl);
		shareOpen = false;
	}

	async function shareGuild() {
		if (!activeRegistry) return;
		await shareWishlistRegistry(activeRegistry.id, userId, 'guild');
		shareOpen = false;
		await goto(resolve('/messages'));
	}

	async function importRegistryLink(sealUrl: string) {
		const imported = await importWishlistRegistryFromLink(userId, sealUrl);
		await refreshHub(imported.id);
	}
</script>

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<PageHeader
		eyebrow={$_('wishlist.registry')}
		title={$_('wishlist.hub_title')}
		description={$_('wishlist.description')}
	/>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('wishlist.loading')}
		</p>{:else}
		<WishlistHub
			{registries}
			activeId={activeRegistry?.id ?? null}
			onSelect={selectRegistry}
			onCreate={() => (createOpen = true)}
			onEdit={(registry) => {
				editingRegistry = registry;
				editOpen = true;
			}}
			onDelete={(registry) => {
				deletingRegistry = registry;
				deleteOpen = true;
			}}
		/>
		<div class="flex justify-end">
			<WishlistImport onImportLink={importRegistryLink} />
		</div>
		{#if activeRegistry}
			<header
				class="flex flex-wrap items-end justify-between gap-3 border-b border-dashed border-primary/20 pb-4"
			>
				<div>
					<h2 class="font-serif text-3xl font-black uppercase">{activeRegistry.title}</h2>
					<p class="mt-2 font-serif italic text-muted-foreground">{activeRegistry.description}</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" onclick={() => (shareOpen = true)}
						>{$_('wishlist.share_title')}</Button
					><Button onclick={() => (pickerOpen = true)}>{$_('wishlist.add_card_action')}</Button>
				</div>
			</header>
			<div class="flex flex-wrap gap-1 border-b border-dashed border-primary/20 pb-3">
				<Button
					size="xs"
					variant={activeTab === 'cards' ? 'default' : 'outline'}
					onclick={() => (activeTab = 'cards')}>{$_('wishlist.cards_tab')}</Button
				>
				<Button
					size="xs"
					variant={activeTab === 'owners' ? 'default' : 'outline'}
					onclick={() => (activeTab = 'owners')}>{$_('wishlist.owners_tab')}</Button
				>
			</div>
			{#if activeTab === 'cards'}<div class="flex flex-wrap gap-1">
					<Button
						size="xs"
						variant={sortBy === 'rarity' ? 'default' : 'outline'}
						onclick={() => (sortBy = 'rarity')}>{$_('wishlist.sort_rarity')}</Button
					><Button
						size="xs"
						variant={sortBy === 'date' ? 'default' : 'outline'}
						onclick={() => (sortBy = 'date')}>{$_('wishlist.sort_date')}</Button
					><Button
						size="xs"
						variant={sortBy === 'opportunity' ? 'default' : 'outline'}
						onclick={() => (sortBy = 'opportunity')}>{$_('wishlist.sort_opportunity')}</Button
					>
				</div>
				<WishlistSocialGrid
					cards={activeCards}
					onRemove={removeCard}
					onOpen={(card) => (selectedCard = card)}
					onInitiateTrade={proposeTrade}
				/>{:else}<WishlistOwnerSummary
					cards={activeCards}
					onInitiateTrade={proposeGroupTrade}
				/>{/if}
		{/if}
	{/if}
</section>

<WishlistPicker
	bind:open={pickerOpen}
	existingCardIds={activeRegistry?.cardIds ?? []}
	loadCards={getCards}
	onSelect={addCard}
/>
<WishlistRegistryDrawers
	bind:createOpen
	bind:editOpen
	bind:deleteOpen
	registry={editingRegistry ?? deletingRegistry}
	onCreate={create}
	onUpdate={updateRegistry}
	onDelete={removeRegistry}
/>
{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		wishlists={registries}
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
<WishlistShareModal bind:open={shareOpen} onShareLink={shareLink} onShareGuild={shareGuild} />
<WishlistTradeDrawer
	bind:open={tradeOpen}
	card={tradeCard}
	friend={tradeFriend}
	onConfirm={confirmTrade}
/>
