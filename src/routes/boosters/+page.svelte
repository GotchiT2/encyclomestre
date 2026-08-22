<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/i18n';
	import {
		addWishlistRegistryCard,
		getWikiForgeBoosterStatus,
		getWikiForgeTags,
		getWishlists,
		openWikiForgeBooster,
		toCollectionCardRecord
	} from '$lib/api';
	import BoosterOpeningStage from '$lib/components/boosters/booster-opening-stage.svelte';
	import { formatBoosterDelay } from '$lib/components/boosters/booster-countdown';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import type {
		CardRecord,
		CollectionTag,
		CollectionTagAssignments,
		WishlistRegistrySummary
	} from '$lib/types';

	let inventory = $state<{
		availableBoosters: number;
		maxBoosters?: number;
		nextBoosterAvailableAt: string | null;
	} | null>(null);
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
	let nextStatusRetryAt = 0;
	const nextDelay = $derived(
		inventory?.nextBoosterAvailableAt
			? Math.max(0, new Date(inventory.nextBoosterAvailableAt).getTime() - now)
			: 0
	);
	const nextDelayLabel = $derived(formatBoosterDelay(nextDelay));

	async function refreshInventory() {
		if (statusRefreshing) return;
		statusRefreshing = true;
		try {
			inventory = await getWikiForgeBoosterStatus();
			now = Date.now();
		} finally {
			statusRefreshing = false;
		}
	}

	onMount(() => {
		const timer = window.setInterval(() => {
			now = Date.now();
			const rechargeAt = inventory?.nextBoosterAvailableAt
				? new Date(inventory.nextBoosterAvailableAt).getTime()
				: 0;
			if (rechargeAt && now >= rechargeAt && now >= nextStatusRetryAt) {
				nextStatusRetryAt = now + 2_000;
				void refreshInventory().catch(() => undefined);
			}
		}, 1_000);
		void refreshInventory().catch(() => undefined);
		return () => window.clearInterval(timer);
	});

	async function open() {
		if (!inventory?.availableBoosters || opening) return;
		opening = true;
		result = null;
		openingError = false;
		try {
			result = (await openWikiForgeBooster()).cards.map(toCollectionCardRecord);
			openingId += 1;
			try {
				await refreshInventory();
			} catch {
				inventory = inventory
					? { ...inventory, availableBoosters: Math.max(0, inventory.availableBoosters - 1) }
					: inventory;
			}
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
			[card.id]: (card.collectionTags ?? []).map((tag) => tag.id)
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
			available={inventory.availableBoosters}
			maximum={inventory.maxBoosters ?? 1}
			nextDelay={inventory.nextBoosterAvailableAt ? nextDelayLabel : undefined}
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
		onToggleWishlist={(wishlistId, selected) =>
			void toggleWishlist(wishlistId, selectedCard!, selected)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
