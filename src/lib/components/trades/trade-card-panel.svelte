<script lang="ts">
	import { _ } from '$lib/i18n';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { untrack } from 'svelte';
	import type {
		CardRarity,
		CardRecord,
		CardVariant,
		PaginatedResponse,
		TradeCardSearchQuery
	} from '$lib/types';

	let {
		title,
		scopeKey,
		ownerName,
		initialCards = [],
		loadCards,
		selectedIds = $bindable<string[]>([]),
		credits = $bindable(0)
	}: {
		title: string;
		scopeKey: string;
		ownerName?: string;
		initialCards?: CardRecord[];
		loadCards: (query: TradeCardSearchQuery) => Promise<PaginatedResponse<CardRecord>>;
		selectedIds?: string[];
		credits?: number;
	} = $props();

	let query = $state('');
	let rarities = $state<CardRarity[]>([]);
	let sortBy = $state<'rarity' | 'name'>('rarity');
	let variant = $state<CardVariant>('all');
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let resultCards = $state<CardRecord[]>([]);
	let knownCards = $state<CardRecord[]>([]);
	let hasLoaded = $state(false);
	let loading = $state(false);
	let failed = $state(false);
	let activeScope = $state('');
	const pageSize = 12;
	const selectedCards = $derived(
		selectedIds
			.map((id) => knownCards.find((card) => card.id === id))
			.filter(Boolean) as CardRecord[]
	);

	$effect(() => {
		if (activeScope === scopeKey) {
			knownCards = mergeCards(
				untrack(() => knownCards),
				initialCards
			);
			return;
		}
		activeScope = scopeKey;
		query = '';
		rarities = [];
		sortBy = 'rarity';
		variant = 'all';
		page = 1;
		totalPages = 1;
		total = 0;
		resultCards = [];
		knownCards = [...initialCards];
		hasLoaded = false;
		failed = false;
	});

	function mergeCards(current: CardRecord[], incoming: CardRecord[]) {
		return [...new Map([...current, ...incoming].map((card) => [card.id, card])).values()];
	}

	function markFiltersChanged() {
		page = 1;
		resultCards = [];
		hasLoaded = false;
		failed = false;
	}

	async function search(nextPage = 1) {
		if (loading) return;
		loading = true;
		failed = false;
		try {
			const response = await loadCards({
				query,
				rarities,
				variant,
				sortBy,
				page: nextPage - 1,
				pageSize
			});
			page = response.meta.page;
			totalPages = response.meta.totalPages;
			total = response.meta.total;
			resultCards = response.items;
			knownCards = mergeCards(knownCards, response.items);
			hasLoaded = true;
		} catch {
			failed = true;
			resultCards = [];
			hasLoaded = true;
		} finally {
			loading = false;
		}
	}
</script>

<section class="min-w-0 border border-primary/25 bg-background/40 p-2 sm:p-3">
	<h2 class="font-serif text-lg font-black uppercase tracking-tight sm:text-xl">{title}</h2>
	<div class="mt-2 border border-primary/20 bg-card p-2">
		<p class="font-mono text-[9px] uppercase tracking-widest text-primary">
			{$_('trades.counterparties')}
		</p>
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each selectedCards as card (card.id)}
				<Button
					size="xs"
					variant="outline"
					class="h-auto max-w-full whitespace-normal break-words text-left"
					style={`color:${card.rarityColor};border-color:${card.rarityColor}`}
					onclick={() => (selectedIds = selectedIds.filter((id) => id !== card.id))}
				>
					{card.title}<XIcon data-icon="inline-end" />
				</Button>
			{/each}
			{#if credits > 0}
				<span
					class="border border-primary/60 bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"
				>
					{credits}
					{$_('trades.credit_chip')}
				</span>
			{/if}
			{#if !selectedCards.length && !credits}
				<span class="font-serif text-sm italic text-muted-foreground">
					{$_('trades.no_counterparty')}
				</span>
			{/if}
		</div>
	</div>

	<CardSearchPanel class="mt-2">
		<form
			class="grid gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				void search();
			}}
		>
			<div class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(14rem,1fr)_auto_auto] lg:items-end">
				<Input
					bind:value={query}
					oninput={markFiltersChanged}
					placeholder={$_('collection.search')}
					class="h-9 w-full text-sm"
				/>
				<select
					bind:value={sortBy}
					onchange={markFiltersChanged}
					aria-label={$_('collection.sort')}
					class="h-9 w-full self-end border border-primary/50 bg-card px-2 py-0 font-mono text-[10px] leading-9 uppercase tracking-wider text-primary outline-none focus:border-primary lg:w-40"
				>
					<option value="rarity">{$_('collection.sortRarity')}</option>
					<option value="name">{$_('collection.sortName')}</option>
				</select>
				<label class="font-mono text-[9px] uppercase tracking-widest text-primary">
					{$_('trades.credits')}
					<Input
						class="mt-1 h-9 w-full text-sm lg:w-24"
						type="number"
						min="0"
						bind:value={credits}
					/>
				</label>
			</div>
			<RaritySelector
				options={cardRarityOptions}
				bind:selected={rarities}
				onChange={markFiltersChanged}
			/>
			<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
				<CardVariantSelector bind:value={variant} onChange={markFiltersChanged} />
				<Button type="submit" disabled={loading} class="min-h-10 sm:min-w-40">
					<SearchIcon data-icon="inline-start" />
					{loading ? $_('trades.loading_cards') : $_('trades.search_cards')}
				</Button>
			</div>
		</form>
	</CardSearchPanel>

	{#if !hasLoaded && !loading}
		<p
			class="mt-3 border border-dashed border-primary/25 p-5 text-center font-serif italic text-muted-foreground"
		>
			{$_('trades.filter_cards_prompt')}
		</p>
	{:else if failed}
		<p class="mt-3 border border-destructive/40 bg-destructive/10 p-4 text-destructive">
			{$_('trades.cards_load_error')}
		</p>
	{:else if loading}
		<p class="mt-3 p-5 text-center font-mono text-[10px] uppercase tracking-widest text-primary">
			{$_('trades.loading_cards')}
		</p>
	{:else if !resultCards.length}
		<p
			class="mt-3 border border-dashed border-primary/25 p-5 text-center font-serif italic text-muted-foreground"
		>
			{$_('trades.no_filtered_cards')}
		</p>
	{:else}
		<p class="mt-3 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
			{$_('trades.filtered_card_count', { values: { count: total } })}
		</p>
		<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
			{#each resultCards.filter((card) => !selectedIds.includes(card.id)) as card (card.id)}
				<div class="relative min-w-0">
					<CardTile {card} tags={card.collectionTags ?? []} showFriendOwners={false} />
					{#if ownerName}
						<span
							class="absolute top-2 right-2 z-10 border border-primary/60 bg-card px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider text-primary"
						>
							{$_('trades.contact_owns', { values: { user: ownerName } })}
						</span>
					{/if}
					<Button
						aria-label={card.title}
						class="absolute inset-0 z-20 h-full w-full border-0 bg-transparent text-transparent hover:bg-primary/20"
						onclick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							selectedIds = [...selectedIds, card.id];
						}}
					/>
				</div>
			{/each}
		</div>
		<div
			class="sticky bottom-0 z-30 mt-3 flex items-center justify-between gap-2 border-t border-primary/25 bg-card/95 px-2 py-2 backdrop-blur-sm"
		>
			<Button
				size="xs"
				variant="outline"
				disabled={page === 1 || loading}
				onclick={() => void search(page - 1)}
			>
				{$_('codex.previous')}
			</Button>
			<span class="font-mono text-[9px] uppercase tracking-widest text-primary">
				{$_('codex.page')}
				{page} / {totalPages}
			</span>
			<Button
				size="xs"
				variant="outline"
				disabled={page === totalPages || loading}
				onclick={() => void search(page + 1)}
			>
				{$_('codex.next')}
			</Button>
		</div>
	{/if}
</section>
