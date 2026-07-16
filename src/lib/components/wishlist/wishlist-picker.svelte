<script lang="ts">
	import CardTile from '$lib/components/card-tile.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions, compareCardsByRarityDesc } from '$lib/domain/cards/rarities';
	import { matchesCardVariant } from '$lib/domain/cards/variants';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import type { CardQuery } from '$lib/api';
	import type { CardRarity, CardRecord, CardVariant, PaginatedResponse } from '$lib/types';

	let {
		open = $bindable(false),
		existingCardIds,
		loadCards,
		onSelect
	}: {
		open?: boolean;
		existingCardIds: string[];
		loadCards: (query: CardQuery) => Promise<PaginatedResponse<CardRecord>>;
		onSelect: (card: CardRecord) => void | Promise<void>;
	} = $props();

	const pageSize = 12;
	let cards = $state<CardRecord[]>([]);
	let query = $state('');
	let selectedRarities = $state<CardRarity[]>([]);
	let selectedTagIds = $state<string[]>([]);
	let sortBy = $state<'rarity' | 'name'>('rarity');
	let variant = $state<CardVariant>('all');
	let page = $state(1);
	let totalPages = $state(1);
	let loading = $state(false);
	let failed = $state(false);
	let debounceTimer: number | undefined;
	let requestId = 0;
	const availableTags = $derived([
		...new Map(
			cards.flatMap((card) => card.collectionTags ?? []).map((tag) => [tag.id, tag])
		).values()
	]);
	const visibleCards = $derived(
		cards
			.filter(
				(card) =>
					!existingCardIds.includes(card.id) &&
					matchesCardVariant(card, variant) &&
					(!selectedTagIds.length ||
						selectedTagIds.every((tagId) =>
							(card.collectionTags ?? []).some((tag) => tag.id === tagId)
						))
			)
			.toSorted((left, right) =>
				sortBy === 'name'
					? left.title.localeCompare(right.title, 'fr')
					: compareCardsByRarityDesc(left, right)
			)
	);

	$effect(() => {
		const parameters: CardQuery = {
			page,
			pageSize,
			query: query.trim() || undefined,
			rarities: selectedRarities,
			variant,
			sortBy,
			sortDirection: sortBy === 'rarity' ? 'DESC' : 'ASC'
		};
		if (!open) {
			requestId += 1;
			loading = false;
			return;
		}
		window.clearTimeout(debounceTimer);
		const currentRequest = ++requestId;
		loading = true;
		failed = false;
		debounceTimer = window.setTimeout(
			async () => {
				try {
					const result = await loadCards(parameters);
					if (currentRequest !== requestId) return;
					cards = result.items;
					totalPages = result.meta.totalPages;
				} catch {
					if (currentRequest !== requestId) return;
					cards = [];
					failed = true;
				} finally {
					if (currentRequest === requestId) loading = false;
				}
			},
			query.trim() ? 350 : 0
		);
		return () => window.clearTimeout(debounceTimer);
	});

	function toggleTag(tagId: string) {
		selectedTagIds = selectedTagIds.includes(tagId)
			? selectedTagIds.filter((value) => value !== tagId)
			: [...selectedTagIds, tagId];
		page = 1;
	}

	async function select(card: CardRecord) {
		await onSelect(card);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="h-[min(92dvh,58rem)] max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0">
		<div class="flex min-h-12 items-center gap-3 border-b border-primary/20 px-4 py-2 pr-14">
			<p class="shrink-0 font-mono text-[9px] uppercase tracking-widest text-primary">
				{$_('wishlist.catalogue')}
			</p>
			<span class="h-4 w-px bg-primary/25" aria-hidden="true"></span>
			<Dialog.Title class="truncate text-lg leading-tight sm:text-xl"
				>{$_('wishlist.add_card')}</Dialog.Title
			>
		</div>
		<div class="min-h-0 overflow-y-auto p-3 sm:p-4">
			<CardSearchPanel>
				<div class="grid grid-cols-[minmax(0,1fr)_10rem] gap-2">
					<Input
						bind:value={query}
						oninput={() => (page = 1)}
						placeholder={$_('wishlist.search')}
					/>
					<select
						bind:value={sortBy}
						onchange={() => (page = 1)}
						class="h-10 border-2 border-primary/40 bg-background px-2 font-mono text-[10px] uppercase tracking-wider text-primary outline-none focus:border-primary"
						aria-label={$_('collection.sort')}
					>
						<option value="rarity">{$_('collection.sortRarity')}</option>
						<option value="name">{$_('collection.sortName')}</option>
					</select>
				</div>
				<CardVariantSelector bind:value={variant} onChange={() => (page = 1)} class="mt-3" />
				<div class="mt-3">
					<RaritySelector
						options={cardRarityOptions}
						bind:selected={selectedRarities}
						onChange={() => (page = 1)}
					/>
				</div>
				<div class="mt-3 flex flex-wrap gap-1.5" aria-label={$_('collection.tags')}>
					{#each availableTags as tag (tag.id)}
						<Button
							size="xs"
							variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
							style={selectedTagIds.includes(tag.id)
								? `background-color:${tag.color};border-color:${tag.color};color:#080A09`
								: `color:${tag.color};border-color:${tag.color}`}
							onclick={() => toggleTag(tag.id)}>{tag.name}</Button
						>
					{/each}
				</div>
			</CardSearchPanel>
			{#if loading}
				<p class="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('wishlist.loading')}
				</p>
			{:else if failed}
				<p class="mt-4 text-destructive">{$_('codex.error')}</p>
			{:else}
				<div class="wikiforge-card-grid mt-4">
					{#each visibleCards as card (card.id)}
						<div class="wikiforge-card-size relative">
							<CardTile {card} showFriendOwners={false} />
							<Button
								aria-label={card.title}
								class="absolute inset-0 z-20 size-full border-0 bg-transparent text-transparent hover:bg-primary/20"
								onclick={() => void select(card)}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		<nav
			class="flex shrink-0 items-center justify-between border-t border-primary/25 bg-card px-3 py-2 sm:px-4"
			aria-label={$_('codex.page')}
			data-testid="card-picker-pagination"
		>
			<Button size="sm" variant="outline" disabled={page === 1} onclick={() => (page -= 1)}
				>{$_('codex.previous')}</Button
			>
			<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('codex.page')}
				{page} / {totalPages}
			</p>
			<Button size="sm" variant="outline" disabled={page === totalPages} onclick={() => (page += 1)}
				>{$_('codex.next')}</Button
			>
		</nav>
	</Dialog.Content>
</Dialog.Root>
