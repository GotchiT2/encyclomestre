<script lang="ts">
	import { browser } from '$app/environment';
	import CardGrid from '$lib/components/collection/card-grid.svelte';
	import FilterControls from '$lib/components/collection/filter-controls.svelte';
	import SelectionPanel from '$lib/components/collection/selection-panel.svelte';
	import TagEditor from '$lib/components/collection/tag-editor.svelte';
	import {
		persistCollectionTagState,
		restoreCollectionTagState
	} from '$lib/collection/tag-persistence';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardRecord, CollectionTag, CollectionTagAssignments } from '$lib/types';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	const newTagOption = '__new_tag__';
	const untaggedOption = '__untagged__';
	const rarities: { value: CardRarity; initials: string; color: string }[] = [
		{ value: 'Légendaire', initials: 'L', color: '#E5A93C' },
		{ value: 'Ultra-Rare', initials: 'UR', color: '#A855F7' },
		{ value: 'Super-Rare', initials: 'SR', color: '#10B981' },
		{ value: 'Rare', initials: 'R', color: '#3B82F6' },
		{ value: 'Peu Commune', initials: 'PC', color: '#B45309' },
		{ value: 'Commune', initials: 'C', color: '#6B7280' }
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

	onMount(() => {
		({ tags, assignments } = restoreCollectionTagState(localStorage));
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

	function applyTagToSelection() {
		if (!bulkTagId || !selectedCardIds.length) return;
		const nextAssignments = { ...assignments };
		for (const cardId of selectedCardIds) {
			nextAssignments[cardId] = [...new Set([...(nextAssignments[cardId] ?? []), bulkTagId])];
		}
		assignments = nextAssignments;
		selectedCardIds = [];
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
	<header class="border-b border-dashed border-primary/30 pb-6">
		<p class="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
			{$_('collection.eyebrow')}
		</p>
		<h1
			class="mt-3 font-serif text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl"
		>
			{$_('collection.title')}
		</h1>
		<p class="mt-3 max-w-2xl font-serif italic leading-relaxed text-muted-foreground">
			{$_('collection.description')}
		</p>
	</header>

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
			/>
		{:else}<p class="border border-primary/30 bg-card p-5 font-serif italic text-muted-foreground">
				{$_('collection.empty')}
			</p>{/if}
		{#if isSelectionMode}<SelectionPanel
				selectedCount={selectedCardIds.length}
				{tags}
				bind:bulkTagId
				onSelectAll={() => toggleSelectAll(visibleCards(collection.items))}
				onApply={applyTagToSelection}
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
