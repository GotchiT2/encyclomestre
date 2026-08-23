<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import {
		addWishlistRegistryCard,
		getBoosterInventory,
		getWikiForgeTags,
		getWishlists,
		openBooster
	} from '$lib/api';
	import BoosterOpeningStage from '$lib/components/boosters/booster-opening-stage.svelte';
	import {
		formatBoosterDelay,
		getBoosterRefreshDelay
	} from '$lib/components/boosters/booster-countdown';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import type {
		BoosterInventory,
		CardRecord,
		CollectionTag,
		CollectionTagAssignments,
		WishlistRegistrySummary
	} from '$lib/types';

	let inventory = $state<BoosterInventory | null>(null);
	let result = $state<CardRecord[] | null>(null);
	let opening = $state(false);
	let openingError = $state(false);
	let openingId = $state(0);
	let selectedCard = $state<CardRecord | null>(null);
	let tags = $state<CollectionTag[]>([]);
	let assignments = $state<CollectionTagAssignments>({});
	let wishlists = $state<WishlistRegistrySummary[]>([]);
	let detailDependenciesLoaded = $state(false);
	let detailDependenciesLoading = $state(false);
	let now = $state(Date.now());
	let statusRefreshing = $state(false);
	let inventoryRefreshTimer: number | undefined;
	let pageActive = false;
	const nextDelay = $derived(
		inventory?.nextRechargeAt ? Math.max(0, new Date(inventory.nextRechargeAt).getTime() - now) : 0
	);
	const nextDelayLabel = $derived(formatBoosterDelay(nextDelay));

	function scheduleInventoryRefresh(nextAvailableAt: string | null) {
		if (inventoryRefreshTimer !== undefined) {
			window.clearTimeout(inventoryRefreshTimer);
			inventoryRefreshTimer = undefined;
		}
		if (!pageActive) return;
		const delay = getBoosterRefreshDelay(nextAvailableAt);
		if (delay === null) return;
		inventoryRefreshTimer = window.setTimeout(() => {
			inventoryRefreshTimer = undefined;
			void refreshInventory().catch(() => undefined);
		}, delay + 250);
	}

	async function refreshInventory() {
		if (statusRefreshing) return;
		statusRefreshing = true;
		try {
			inventory = await getBoosterInventory();
			now = Date.now();
			scheduleInventoryRefresh(inventory.nextRechargeAt);
		} finally {
			statusRefreshing = false;
		}
	}

	onMount(() => {
		pageActive = true;
		const timer = window.setInterval(() => {
			now = Date.now();
		}, 1_000);
		void refreshInventory().catch(() => undefined);
		return () => {
			pageActive = false;
			window.clearInterval(timer);
			if (inventoryRefreshTimer !== undefined) window.clearTimeout(inventoryRefreshTimer);
		};
	});

	async function open() {
		if (!inventory?.available || opening) return;
		opening = true;
		result = null;
		openingError = false;
		try {
			const opened = await openBooster();
			result = opened.pulls.map((pull) => pull.card);
			inventory = opened.inventory;
			scheduleInventoryRefresh(inventory.nextRechargeAt);
			openingId += 1;
		} catch {
			openingError = true;
		} finally {
			opening = false;
		}
	}

	async function loadDetailDependencies() {
		if (detailDependenciesLoaded || detailDependenciesLoading) return;
		detailDependenciesLoading = true;
		try {
			const [loadedTags, loadedWishlists] = await Promise.all([getWikiForgeTags(), getWishlists()]);
			tags = loadedTags;
			wishlists = loadedWishlists;
			detailDependenciesLoaded = true;
		} catch {
			detailDependenciesLoaded = false;
		} finally {
			detailDependenciesLoading = false;
		}
	}

	function openCardDetail(card: CardRecord) {
		selectedCard = card;
		assignments = {
			...assignments,
			[card.id]: card.collectionTagIds ?? (card.collectionTags ?? []).map((tag) => tag.id)
		};
		void loadDetailDependencies();
	}

	async function toggleWishlist(wishlistId: string, card: CardRecord, selected: boolean) {
		if (!selected) return;
		const pageId = String(card.baseCardId ?? card.catalogueId ?? card.id);
		await addWishlistRegistryCard(wishlistId, '', pageId);
		wishlists = await getWishlists();
	}
</script>

<section class="flex flex-col gap-8">
	<PageHeader
		eyebrow={$_('boosters.eyebrow')}
		title={$_('boosters.title')}
		description={$_('boosters.description')}
	/>
	{#if inventory}
		<BoosterOpeningStage
			available={inventory.available}
			maximum={inventory.capacity}
			nextDelay={inventory.nextRechargeAt ? nextDelayLabel : undefined}
			{opening}
			{openingId}
			cards={result}
			error={openingError}
			suspended={Boolean(selectedCard)}
			onOpen={open}
			onOpenCard={openCardDetail}
			onReset={() => {
				result = null;
				openingError = false;
			}}
		/>
	{:else}
		<div class="forge-panel min-h-[34rem] animate-pulse"></div>
	{/if}
</section>

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		owned
		{wishlists}
		bind:tags
		bind:assignments
		loadVariantCopies={false}
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
