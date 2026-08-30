<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRarity } from '$lib/types';
	import type { CardSearchSort } from '$lib/types';

	let {
		query,
		sortBy,
		sortDirection,
		selectedRarities,
		rarityCounts
	}: {
		query: string;
		sortBy: CardSearchSort;
		sortDirection: string;
		selectedRarities: CardRarity[];
		/** Nombre de résultats par rareté, affiché sur les pastilles. */
		rarityCounts?: Record<string, number | undefined>;
	} = $props();

	let form: HTMLFormElement;
	let searchInput = $state<HTMLInputElement | null>(null);
	let debounceTimer: number | undefined;
	let localQuery = $state('');
	let localSortBy = $state<CardSearchSort>('rarity');
	let localSortDirection = $state<'ASC' | 'DESC'>('DESC');
	let localRarities = $state<CardRarity[]>([]);
	let pending = $state(false);
	let restoreSearchFocus = $state(false);

	$effect(() => {
		localQuery = query;
		localSortBy = sortBy;
		localSortDirection = sortDirection === 'ASC' ? 'ASC' : 'DESC';
		localRarities = [...selectedRarities];
	});

	$effect(() => {
		if (!restoreSearchFocus || query !== localQuery) return;
		restoreSearchFocus = false;
		requestAnimationFrame(() => searchInput?.focus({ preventScroll: true }));
	});

	function scheduleSubmit(delay = 400, focusSearchInput = false) {
		window.clearTimeout(debounceTimer);
		pending = true;
		restoreSearchFocus = focusSearchInput;
		debounceTimer = window.setTimeout(() => form.requestSubmit(), delay);
	}

	function handleTextInput() {
		if (/\s$/.test(localQuery)) {
			window.clearTimeout(debounceTimer);
			pending = false;
			restoreSearchFocus = false;
			return;
		}
		if (localQuery.trim()) {
			localSortBy = 'relevance';
			localSortDirection = 'DESC';
		}
		scheduleSubmit(650, true);
	}

	async function submitFilters(event: SubmitEvent) {
		event.preventDefault();
		const parameters = new SvelteURLSearchParams();
		for (const [key, value] of new FormData(form)) {
			if (typeof value === 'string') parameters.append(key, value);
		}
		// The route itself is resolved; the form values provide its query string.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`${resolve('/cards')}?${parameters}`, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
		pending = false;
	}
</script>

<form bind:this={form} method="GET" onsubmit={submitFilters}>
	<Field.FieldGroup class="gap-5">
		<div class="grid gap-3 @lg:grid-cols-2">
			<Field.Field>
				<Field.FieldLabel for="codex-search" class="forge-label">
					{$_('codex.search')}
				</Field.FieldLabel>
				<Input
					id="codex-search"
					bind:ref={searchInput}
					name="q"
					bind:value={localQuery}
					placeholder={$_('codex.search')}
					oninput={handleTextInput}
				/>
			</Field.Field>
			<Field.Field>
				<Field.FieldLabel for="codex-sort" class="forge-label">
					{$_('filters.sortBy')}
				</Field.FieldLabel>
				<select
					id="codex-sort"
					name="sortBy"
					bind:value={localSortBy}
					onchange={() => scheduleSubmit(80)}
					class="w-full"
				>
					<option value="relevance">{$_('collection.sortRelevance')}</option>
					<option value="rarity">{$_('collection.sortRarity')}</option>
					<option value="name">{$_('collection.sortName')}</option>
				</select>
			</Field.Field>
		</div>

		<Field.Field>
			<Field.FieldLabel for="codex-sort-direction" class="forge-label">
				{$_('codex.sortDirection')}
			</Field.FieldLabel>
			<select
				id="codex-sort-direction"
				name="sortDirection"
				bind:value={localSortDirection}
				onchange={() => scheduleSubmit(80)}
				class="w-full"
			>
				<option value="DESC">{$_('codex.descending')}</option>
				<option value="ASC">{$_('codex.ascending')}</option>
			</select>
		</Field.Field>

		<Field.FieldSet class="gap-2">
			<Field.FieldLegend class="forge-label">{$_('codex.rarities')}</Field.FieldLegend>
			<RaritySelector
				options={cardRarityOptions}
				bind:selected={localRarities}
				name="rarity"
				multiple={false}
				counts={rarityCounts}
				compact
				onChange={() => scheduleSubmit(80)}
			/>
		</Field.FieldSet>
	</Field.FieldGroup>

	<p
		class="mt-3 min-h-4 text-[10px] font-bold tracking-wider text-[var(--energy-soft)] uppercase"
		aria-live="polite"
	>
		{pending ? $_('codex.filtersUpdating') : ''}
	</p>
</form>
