<script lang="ts">
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRarity } from '$lib/types';

	let {
		query,
		sortBy,
		sortDirection,
		selectedRarities,
		rarities
	}: {
		query: string;
		sortBy: string;
		sortDirection: string;
		selectedRarities: CardRarity[];
		rarities: CardRarity[];
	} = $props();

	let form: HTMLFormElement;
	let debounceTimer: number | undefined;
	let localQuery = $state('');
	let localRarities = $state<CardRarity[]>([]);
	let pending = $state(false);

	const rarityColors: Record<CardRarity, string> = {
		Commune: '#d3e4f8',
		'Peu Commune': '#1d71cf',
		Rare: '#5c1dcf',
		'Super-Rare': '#b41dcf',
		'Ultra-Rare': '#cf7d1d',
		Légendaire: '#cf1d1d',
		KTD: '#1dcf47'
	};
	const rarityOptions = $derived(rarities.map((value) => ({ value, color: rarityColors[value] })));

	$effect(() => {
		localQuery = query;
		localRarities = [...selectedRarities];
	});

	function scheduleSubmit(delay = 400) {
		window.clearTimeout(debounceTimer);
		pending = true;
		debounceTimer = window.setTimeout(() => form.requestSubmit(), delay);
	}
</script>

<form bind:this={form} method="GET" class="forge-panel p-4 sm:p-5">
	<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
		<label class="grid gap-2">
			<span class="forge-label">{$_('codex.search')}</span>
			<Input
				name="q"
				bind:value={localQuery}
				placeholder={$_('codex.search')}
				oninput={() => scheduleSubmit(450)}
			/>
		</label>
		<label class="grid gap-2">
			<span class="forge-label">{$_('collection.sortName')}</span>
			<select name="sortBy" onchange={() => scheduleSubmit(80)}>
				<option value="rarity" selected={sortBy === 'rarity'}>{$_('collection.sortRarity')}</option>
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
			options={rarityOptions}
			bind:selected={localRarities}
			name="rarity"
			onChange={() => scheduleSubmit(80)}
		/>
	</fieldset>
	<p
		class="mt-3 min-h-4 text-[10px] font-bold tracking-wider text-[var(--energy-soft)] uppercase"
		aria-live="polite"
	>
		{pending ? $_('codex.filtersUpdating') : ''}
	</p>
</form>
