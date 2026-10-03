<script lang="ts">
	import { operationError } from '$lib/domain/operation-error';
	import CardTile from '$lib/components/card-tile.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { _ } from '$lib/i18n';
	import type { CardQuery } from '$lib/api';
	import type { CardRecord, CardSearchSort, PaginatedResponse } from '$lib/types';

	let {
		open = $bindable(false),
		existingCardIds,
		loadCards,
		onSelect,
		onSelectMany,
		title = $_('wishlist.add_card'),
		catalogueLabel = $_('wishlist.catalogue')
	}: {
		open?: boolean;
		existingCardIds: string[];
		loadCards: (query: CardQuery) => Promise<PaginatedResponse<CardRecord>>;
		onSelect: (card: CardRecord) => void | Promise<void>;
		onSelectMany?: (cards: CardRecord[]) => void | Promise<void>;
		title?: string;
		catalogueLabel?: string;
	} = $props();

	const pageSize = 12;
	let cards = $state<CardRecord[]>([]);
	let query = $state('');
	let sortBy = $state<CardSearchSort>('name');
	let page = $state(1);
	let totalPages = $state(1);
	let loading = $state(false);
	let failed = $state(false);
	let debounceTimer: number | undefined;
	let requestId = 0;
	let selectedCards = $state<CardRecord[]>([]);
	const selectedIds = $derived(selectedCards.map((card) => String(card.baseCardId ?? card.id)));
	let selecting = $state(false);
	let mutationError = $state('');
	const visibleCards = $derived(
		cards.filter((card) => !existingCardIds.includes(String(card.baseCardId ?? card.id)))
	);

	$effect(() => {
		const parameters: CardQuery = {
			page,
			pageSize,
			query: query.trim() || undefined,
			sortBy,
			sortDirection: sortBy === 'name' ? 'ASC' : 'DESC'
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

	async function select(card: CardRecord) {
		if (!onSelectMany) {
			if (selecting) return;
			selecting = true;
			mutationError = '';
			try {
				await onSelect(card);
			} catch (cause) {
				mutationError = operationError(cause);
			} finally {
				selecting = false;
			}
			return;
		}
		const id = String(card.baseCardId ?? card.id);
		selectedCards = selectedIds.includes(id)
			? selectedCards.filter(
					(selectedCard) => String(selectedCard.baseCardId ?? selectedCard.id) !== id
				)
			: [...selectedCards, card].slice(0, 500);
	}

	async function addSelected() {
		if (!onSelectMany || !selectedIds.length || selecting) return;
		mutationError = '';
		selecting = true;
		try {
			await onSelectMany(selectedCards);
			selectedCards = [];
		} catch (cause) {
			mutationError = operationError(cause);
		} finally {
			selecting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="h-[min(92dvh,58rem)] max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0 sm:p-0 overflow-hidden"
	>
		<div class="flex min-h-12 items-center gap-3 border-b border-primary/20 px-4 py-2 pr-14">
			<p class="shrink-0 font-mono text-[9px] uppercase tracking-widest text-primary">
				{catalogueLabel}
			</p>
			<span class="h-4 w-px bg-primary/25" aria-hidden="true"></span>
			<Dialog.Title class="truncate text-lg leading-tight sm:text-xl">{title}</Dialog.Title>
		</div>
		<div class="min-h-0 overflow-y-auto p-3 sm:p-4">
			{#if mutationError}<p class="mb-3 text-destructive" role="alert">{mutationError}</p>{/if}
			<CardSearchPanel>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
					<Input
						bind:value={query}
						oninput={() => {
							page = 1;
							if (query.trim()) sortBy = 'relevance';
						}}
						placeholder={$_('wishlist.search')}
					/>
					<select
						bind:value={sortBy}
						onchange={() => (page = 1)}
						class="h-10 border-2 border-primary/40 bg-background px-2 font-mono text-[10px] uppercase tracking-wider text-primary outline-none focus:border-primary"
						aria-label={$_('collection.sort')}
					>
						<option value="relevance">{$_('collection.sortRelevance')}</option>
						<option value="name">{$_('collection.sortName')}</option>
					</select>
				</div>
			</CardSearchPanel>
			{#if loading}
				<p class="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('wishlist.loading')}
				</p>
			{:else if failed}
				<p class="mt-4 text-destructive">{$_('codex.error')}</p>
			{:else if !visibleCards.length}
				<p
					class="mt-4 border border-dashed border-primary/25 p-5 text-center italic text-muted-foreground"
				>
					{$_('wishlist.search_empty')}
				</p>
			{:else}
				<div class="wikiforge-card-grid mt-4">
					{#each visibleCards as card (card.id)}
						<div class="wikiforge-card-size relative">
							<CardTile {card} onOpen={select} />
							{#if onSelectMany && selectedIds.includes(String(card.baseCardId ?? card.id))}
								<span
									class="pointer-events-none absolute inset-0 z-40 border-2 border-energy bg-energy/15"
									aria-hidden="true"
								></span>
							{/if}
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
			{#if onSelectMany}
				<Button size="sm" disabled={!selectedIds.length || selecting} onclick={addSelected}
					>{$_('wishlist.add_selected', { values: { count: selectedIds.length } })}</Button
				>
			{:else}
				<p class="font-mono text-[10px] uppercase tracking-widest text-primary">
					{$_('codex.page')}
					{page} / {totalPages}
				</p>
			{/if}
			<Button size="sm" variant="outline" disabled={page === totalPages} onclick={() => (page += 1)}
				>{$_('codex.next')}</Button
			>
		</nav>
	</Dialog.Content>
</Dialog.Root>
