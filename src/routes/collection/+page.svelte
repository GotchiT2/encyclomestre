<script lang="ts">
	import { browser } from '$app/environment';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import CardDetailModal from '$lib/components/cards/card-detail-modal.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import SelectionPanel from '$lib/components/collection/selection-panel.svelte';
	import TagEditor from '$lib/components/collection/tag-editor.svelte';
	import EmptyState from '$lib/components/layout/empty-state.svelte';
	import PageHeader from '$lib/components/layout/page-header.svelte';
	import {
		persistCollectionTagState,
		restoreCollectionTagState
	} from '$lib/collection/tag-persistence';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import { applyWikiForgeTag } from '$lib/api';
	import type { CardRarity, CardRecord, CollectionTag, CollectionTagAssignments } from '$lib/types';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	const newTagOption = '__new_tag__';
	const untaggedOption = '__untagged__';
	const rarities: { value: CardRarity; initials: string; color: string }[] = [
		{ value: 'KTD', initials: 'KTD', color: '#1dcf47' },
		{ value: 'Légendaire', initials: 'L', color: '#cf1d1d' },
		{ value: 'Ultra-Rare', initials: 'UR', color: '#cf7d1d' },
		{ value: 'Super-Rare', initials: 'SR', color: '#b41dcf' },
		{ value: 'Rare', initials: 'R', color: '#5c1dcf' },
		{ value: 'Peu Commune', initials: 'PC', color: '#1d71cf' },
		{ value: 'Commune', initials: 'C', color: '#d3e4f8' }
	];

	let { data }: { data: PageData } = $props();
	let query = $state('');
	let sortBy = $state<'name' | 'rarity'>('rarity');
	let selectedRarities = $state<CardRarity[]>([]);
	let tags = $state<CollectionTag[]>([]);
	let assignments = $state<CollectionTagAssignments>({});
	let tagFilterIds = $state<string[]>([]);
	let isSelectionMode = $state(false);
	let selectedCardIds = $state<string[]>([]);
	let bulkTagId = $state('');
	let isTagEditorOpen = $state(false);
	let hasHydrated = $state(false);
	let selectedCard = $state<CardRecord | null>(null);
	let wishlistedCardIds = $state<string[]>([]);

	onMount(async () => {
		({ tags, assignments } = restoreCollectionTagState(localStorage));
		wishlistedCardIds = JSON.parse(localStorage.getItem('encyclomestre.wishlist-cards') ?? '[]');
		const collection = await data.collection;
		const apiTags = collection.items.flatMap((card) => card.collectionTags ?? []);
		tags = [...new Map([...tags, ...apiTags].map((tag) => [tag.id, tag])).values()];
		assignments = {
			...assignments,
			...Object.fromEntries(
				collection.items.map((card) => [card.id, (card.collectionTags ?? []).map((tag) => tag.id)])
			)
		};
		hasHydrated = true;
	});

	$effect(() => {
		if (browser && hasHydrated) persistCollectionTagState(localStorage, { tags, assignments });
	});

	function handleTagFilterChange() {
		if (tagFilterIds.includes(newTagOption)) {
			tagFilterIds = tagFilterIds.filter((id) => id !== newTagOption);
			isTagEditorOpen = true;
		}
	}

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

	function toggleWishlist(cardId: string) {
		wishlistedCardIds = wishlistedCardIds.includes(cardId)
			? wishlistedCardIds.filter((id) => id !== cardId)
			: [...wishlistedCardIds, cardId];
		localStorage.setItem('encyclomestre.wishlist-cards', JSON.stringify(wishlistedCardIds));
	}

	function clearFilters() {
		query = '';
		selectedRarities = [];
		tagFilterIds = [];
		sortBy = 'rarity';
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
			{tags}
			{rarities}
			{untaggedOption}
			{newTagOption}
			onTagFilterChange={handleTagFilterChange}
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
		isWishlisted={wishlistedCardIds.includes(selectedCard.id)}
		bind:tags
		bind:assignments
		onToggleWishlist={() => toggleWishlist(selectedCard!.id)}
		onClose={() => (selectedCard = null)}
	/>
{/if}
