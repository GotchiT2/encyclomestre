<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as currentPage } from '$app/state';
	import { onMount } from 'svelte';
	import { currentSession } from '$lib/auth/session';
	import {
		addWishlistRegistryCard,
		createWishlistRegistry,
		deleteWishlistRegistry,
		getCards,
		getWishlistRegistry,
		getWishlists,
		importWishlistRegistryFromLink,
		removeWishlistRegistryCard,
		shareWishlistRegistry
	} from '$lib/api';
	import WishlistHub from '$lib/components/wishlist/wishlist-hub.svelte';
	import WishlistImport from '$lib/components/wishlist/wishlist-import.svelte';
	import WishlistOwnerSummary from '$lib/components/wishlist/wishlist-owner-summary.svelte';
	import WishlistPicker from '$lib/components/wishlist/wishlist-picker.svelte';
	import WishlistRegistryDrawers from '$lib/components/wishlist/wishlist-registry-drawers.svelte';
	import WishlistShareModal from '$lib/components/wishlist/wishlist-share-modal.svelte';
	import WishlistSocialGrid from '$lib/components/wishlist/wishlist-social-grid.svelte';
	import WishlistTradeDrawer from '$lib/components/wishlist/wishlist-trade-drawer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type {
		CardRecord,
		FriendOwnerInfo,
		WishlistRegistry,
		WishlistRegistrySummary
	} from '$lib/types';

	let userId = $state('demo-user');
	let cards = $state<CardRecord[]>([]);
	let registries = $state<WishlistRegistrySummary[]>([]);
	let activeRegistry = $state<WishlistRegistry | null>(null);
	let loading = $state(true);
	let pickerOpen = $state(false);
	let createOpen = $state(false);
	let shareOpen = $state(false);
	let deleteOpen = $state(false);
	let tradeOpen = $state(false);
	let tradeCard = $state<CardRecord | null>(null);
	let tradeFriend = $state<FriendOwnerInfo | null>(null);
	let tradeCardIds = $state<string[]>([]);
	let sortBy = $state<'rarity' | 'date' | 'opportunity'>('rarity');
	let activeTab = $state<'cards' | 'owners'>('cards');

	const activeCards = $derived(
		(activeRegistry?.cardIds ?? [])
			.map((id) => cards.find((card) => card.id === id))
			.filter((card): card is CardRecord => Boolean(card))
			.toSorted((left, right) => {
				if (sortBy === 'opportunity') return right.friendsWhoOwn.length - left.friendsWhoOwn.length;
				if (sortBy === 'date')
					return (
						(activeRegistry?.cardIds.indexOf(right.id) ?? 0) -
						(activeRegistry?.cardIds.indexOf(left.id) ?? 0)
					);
				return right.rarityColor.localeCompare(left.rarityColor);
			})
	);

	onMount(async () => {
		userId = $currentSession?.user.id ?? 'demo-user';
		const [catalogue, summaries] = await Promise.all([
			getCards({ page: 1, pageSize: 100 }),
			getWishlists(userId)
		]);
		cards = catalogue.items;
		registries = summaries;
		const requestedRegistryId = currentPage.url.searchParams.get('registry');
		const initialRegistry =
			summaries.find((registry) => registry.id === requestedRegistryId) ?? summaries[0];
		if (initialRegistry) activeRegistry = await getWishlistRegistry(initialRegistry.id, userId);
		loading = false;
	});

	async function selectRegistry(id: string) {
		activeRegistry = await getWishlistRegistry(id, userId);
	}

	async function refreshHub(selectedId = activeRegistry?.id) {
		registries = await getWishlists(userId);
		if (selectedId) activeRegistry = await getWishlistRegistry(selectedId, userId);
	}

	async function create(title: string, description: string) {
		const created = await createWishlistRegistry(userId, { title, description });
		await refreshHub(created.id);
	}

	async function removeRegistry() {
		if (!activeRegistry) return;
		await deleteWishlistRegistry(activeRegistry.id, userId);
		deleteOpen = false;
		registries = await getWishlists(userId);
		activeRegistry = registries[0] ? await getWishlistRegistry(registries[0].id, userId) : null;
	}

	async function addCard(cardId: string) {
		if (!activeRegistry) return;
		activeRegistry = await addWishlistRegistryCard(activeRegistry.id, userId, cardId);
		registries = await getWishlists(userId);
	}

	async function removeCard(cardId: string) {
		if (!activeRegistry) return;
		activeRegistry = await removeWishlistRegistryCard(activeRegistry.id, userId, cardId);
		registries = await getWishlists(userId);
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
			`/trades?partner=${encodeURIComponent(tradeFriend.friendId)}&cards=${encodeURIComponent(tradeCardIds.join(','))}`
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
		await goto('/messages');
	}

	async function importRegistryLink(sealUrl: string) {
		const imported = await importWishlistRegistryFromLink(userId, sealUrl);
		await refreshHub(imported.id);
	}
</script>

<section class="flex flex-col gap-6 pb-12 sm:gap-8">
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
			{$_('wishlist.registry')}
		</p>
		<h1 class="mt-3 font-serif text-4xl font-black uppercase tracking-tight sm:text-5xl">
			{$_('wishlist.hub_title')}
		</h1>
	</header>
	{#if loading}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('wishlist.loading')}
		</p>{:else}
		<WishlistHub
			{registries}
			activeId={activeRegistry?.id ?? null}
			onSelect={selectRegistry}
			onCreate={() => (createOpen = true)}
			onDelete={() => (deleteOpen = true)}
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
	{cards}
	existingCardIds={activeRegistry?.cardIds ?? []}
	onSelect={addCard}
/>
<WishlistRegistryDrawers
	bind:createOpen
	bind:deleteOpen
	registry={registries.find((registry) => registry.id === activeRegistry?.id) ?? null}
	onCreate={create}
	onDelete={removeRegistry}
/>
<WishlistShareModal bind:open={shareOpen} onShareLink={shareLink} onShareGuild={shareGuild} />
<WishlistTradeDrawer
	bind:open={tradeOpen}
	card={tradeCard}
	friend={tradeFriend}
	onConfirm={confirmTrade}
/>
