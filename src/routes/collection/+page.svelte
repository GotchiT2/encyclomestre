<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- filters build a dynamic query string */
	import { goto } from '$app/navigation';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import SelectionPanel from '$lib/components/collection/selection-panel.svelte';
	import TagEditor from '$lib/components/collection/tag-editor.svelte';
	import {
		buildCollectionFilterTarget,
		untaggedFilterId
	} from '$lib/components/collection/collection-filter-url';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { addWishlistEntry, applyWikiForgeTag, getWishlist, removeWishlistEntry } from '$lib/api';
	import type {
		CardRarity,
		CardRecord,
		CardVariant,
		CollectionTag,
		CollectionTagAssignments
	} from '$lib/types';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	const untaggedOption = untaggedFilterId;
	const rarities = cardRarityOptions;

	let { data }: { data: PageData } = $props();
	let query = $state('');
	let sortBy = $state<'name' | 'rarity'>('rarity');
	let selectedRarities = $state<CardRarity[]>([]);
	let tags = $state<CollectionTag[]>([]);
	let assignments = $state<CollectionTagAssignments>({});
	let tagFilterIds = $state<string[]>([]);
	let variant = $state<CardVariant>('all');
	let isSelectionMode = $state(false);
	let selectedCardIds = $state<string[]>([]);
	let bulkTagId = $state('');
	let isTagEditorOpen = $state(false);
	let selectedCard = $state<CardRecord | null>(null);
	let wishlistedCardIds = $state<string[]>([]);
	let filterTimer: number | undefined;
	let filtersReady = $state(false);

	onMount(async () => {
		query = data.filters.query;
		sortBy = data.filters.sortBy as 'name' | 'rarity';
		selectedRarities = data.filters.selectedRarities;
		tagFilterIds = data.filters.tagFilterIds;
		variant = data.filters.variant;
		const [collection, apiTags, wishlist] = await Promise.all([
			data.collection,
			data.tags,
			getWishlist('', { page: 1, pageSize: 100 })
		]);
		tags = apiTags;
		wishlistedCardIds = wishlist.items.map((entry) => entry.cardId);
		assignments = {
			...Object.fromEntries(
				collection.items.map((card) => [card.id, (card.collectionTags ?? []).map((tag) => tag.id)])
			)
		};
		filtersReady = true;
	});

	$effect(() => {
		const snapshot = { query, sortBy, selectedRarities, tagFilterIds, variant };
		if (!filtersReady) return;
		window.clearTimeout(filterTimer);
		filterTimer = window.setTimeout(() => {
			const target = buildCollectionFilterTarget(snapshot);
			if (`${location.pathname}${location.search}` !== target)
				void goto(target, { replaceState: true });
		}, 400);
		return () => window.clearTimeout(filterTimer);
	});

	function toggleCardSelection(cardId: string) {
		selectedCardIds = selectedCardIds.includes(cardId)
			? selectedCardIds.filter((id) => id !== cardId)
			: [...selectedCardIds, cardId];
	}

	function toggleSelectAll(cards: CardRecord[]) {
		const visibleCardIds = cards.map((card) => card.id);
		const areAllVisibleSelected =
			visibleCardIds.length > 0 &&
			visibleCardIds.every((cardId) => selectedCardIds.includes(cardId));
		selectedCardIds = areAllVisibleSelected
			? selectedCardIds.filter((cardId) => !visibleCardIds.includes(cardId))
			: [...new Set([...selectedCardIds, ...visibleCardIds])];
	}

	async function applyTagToSelection() {
		if (!bulkTagId || !selectedCardIds.length) return;
		await applyWikiForgeTag(bulkTagId, selectedCardIds);
		const nextAssignments = { ...assignments };
		for (const cardId of selectedCardIds) {
			nextAssignments[cardId] = [...new Set([...(nextAssignments[cardId] ?? []), bulkTagId])];
		}
		assignments = nextAssignments;
		selectedCardIds = [];
	}

	async function toggleWishlist(card: CardRecord) {
		const cardId = card.catalogueId ?? card.id;
		if (wishlistedCardIds.includes(cardId)) {
			await removeWishlistEntry('', cardId);
			wishlistedCardIds = wishlistedCardIds.filter((id) => id !== cardId);
		} else {
			await addWishlistEntry('', cardId);
			wishlistedCardIds = [...wishlistedCardIds, cardId];
		}
	}

	function clearFilters() {
		query = '';
		selectedRarities = [];
		tagFilterIds = [];
		sortBy = 'rarity';
		variant = 'all';
	}

	function visibleCards(cards: CardRecord[]) {
		const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
		return cards
			.filter((card) => {
				const cardTags = assignments[card.id] ?? [];
				const matchesTag =
					!tagFilterIds.length ||
					(tagFilterIds.includes(untaggedOption) && !cardTags.length) ||
					tagFilterIds.some((tagId) => cardTags.includes(tagId));
				return (
					card.title.toLocaleLowerCase('fr-FR').includes(normalizedQuery) &&
					(!selectedRarities.length || selectedRarities.includes(card.rarity)) &&
					matchesCardVariant(card, variant) &&
					matchesTag
				);
			})
			.toSorted((a, b) => {
				if (sortBy === 'rarity') {
					const rarityOrder =
						rarities.findIndex((rarity) => rarity.value === a.rarity) -
						rarities.findIndex((rarity) => rarity.value === b.rarity);
					return rarityOrder || a.title.localeCompare(b.title, 'fr');
				}
				return a.title.localeCompare(b.title, 'fr');
			});
	}
</script>

<section class="flex flex-col gap-6 pb-28 sm:gap-8">
	<PageHeader
		eyebrow={$_('collection.eyebrow')}
		title={$_('collection.title')}
		description={$_('collection.description')}
	/>

	<div class="forge-panel p-4 sm:p-5">
		<FilterControls
			bind:query
			bind:sortBy
			bind:selectedRarities
			bind:tagFilterIds
			bind:variant
			{tags}
			{rarities}
			{untaggedOption}
			onOpenTagEditor={() => (isTagEditorOpen = true)}
			onClear={clearFilters}
		/>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<TagEditor bind:open={isTagEditorOpen} bind:tags bind:assignments />
		<Button
			size="sm"
			variant={isSelectionMode ? 'default' : 'outline'}
			aria-pressed={isSelectionMode}
			onclick={() => {
				isSelectionMode = !isSelectionMode;
				if (!isSelectionMode) selectedCardIds = [];
			}}>{$_('collection.selectCards')}</Button
		>
	</div>

	{#await data.collection}<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('collection.loading')}
		</p>
	{:then collection}
		{#if visibleCards(collection.items).length}<CardGrid
				cards={visibleCards(collection.items)}
				{tags}
				{assignments}
				{isSelectionMode}
				{selectedCardIds}
				onToggleCard={toggleCardSelection}
				onOpenCard={(card) => (selectedCard = card)}
			/>
		{:else}<EmptyState title={$_('collection.empty')} />{/if}
		{#if isSelectionMode}<SelectionPanel
				selectedCount={selectedCardIds.length}
				{tags}
				bind:bulkTagId
				onSelectAll={() => toggleSelectAll(visibleCards(collection.items))}
				onApply={() => void applyTagToSelection()}
				onCancel={() => {
					isSelectionMode = false;
					selectedCardIds = [];
				}}
			/>{/if}
	{:catch}<p
			class="border border-destructive/40 bg-destructive/10 p-4 font-serif italic text-destructive"
		>
			{$_('collection.error')}
		</p>{/await}
</section>

{#if selectedCard}
	<CardDetailModal
		card={selectedCard}
		owned
		isWishlisted={wishlistedCardIds.includes(selectedCard.catalogueId ?? selectedCard.id)}
		bind:tags
		bind:assignments
		onToggleWishlist={() => void toggleWishlist(selectedCard!)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
