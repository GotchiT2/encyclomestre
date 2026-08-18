<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRarity } from '$lib/types';

	let {
		query,
		sortBy,
		sortDirection,
		selectedRarities
	}: {
		query: string;
		sortBy: string;
		sortDirection: string;
		selectedRarities: CardRarity[];
	} = $props();

	let form: HTMLFormElement;
	let searchInput = $state<HTMLInputElement | null>(null);
	let debounceTimer: number | undefined;
	let localQuery = $state('');
	let localRarities = $state<CardRarity[]>([]);
	let pending = $state(false);
	let restoreSearchFocus = $state(false);

	$effect(() => {
		localQuery = query;
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
	<CardSearchPanel class="forge-panel" contentClass="p-4 sm:p-5">
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
			<label class="grid gap-2">
				<span class="forge-label">{$_('codex.search')}</span>
				<Input
					bind:ref={searchInput}
					name="q"
					bind:value={localQuery}
					placeholder={$_('codex.search')}
					oninput={handleTextInput}
				/>
			</label>
			<label class="grid gap-2">
				<span class="forge-label">{$_('collection.sortName')}</span>
				<select name="sortBy" onchange={() => scheduleSubmit(80)}>
					<option value="rarity" selected={sortBy === 'rarity'}
						>{$_('collection.sortRarity')}</option
					>
					<option value="name" selected={sortBy === 'name'}>{$_('collection.sortName')}</option>
				</select>
			</label>
			<label class="grid gap-2">
				<span class="forge-label">{$_('codex.sortDirection')}</span>
				<select name="sortDirection" onchange={() => scheduleSubmit(80)}>
					<option value="DESC" selected={sortDirection === 'DESC'}>{$_('codex.descending')}</option>
					<option value="ASC" selected={sortDirection === 'ASC'}>{$_('codex.ascending')}</option>
				</select>
			</label>
		</div>
		<fieldset class="mt-5">
			<legend class="forge-label mb-2">{$_('codex.rarities')}</legend>
			<RaritySelector
				options={cardRarityOptions}
				bind:selected={localRarities}
				name="rarity"
				multiple={false}
				onChange={() => scheduleSubmit(80)}
			/>
		</fieldset>
		<p
			class="mt-3 min-h-4 text-[10px] font-bold tracking-wider text-[var(--energy-soft)] uppercase"
			aria-live="polite"
		>
			{pending ? $_('codex.filtersUpdating') : ''}
		</p>
	</CardSearchPanel>
</form>
