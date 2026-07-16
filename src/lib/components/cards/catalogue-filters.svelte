<script lang="ts">
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardVariant } from '$lib/types';

	let {
		query,
		sortBy,
		sortDirection,
		selectedRarities,
		variant = 'all'
	}: {
		query: string;
		sortBy: string;
		sortDirection: string;
		selectedRarities: CardRarity[];
		variant?: CardVariant;
	} = $props();

	let form: HTMLFormElement;
	let debounceTimer: number | undefined;
	let localQuery = $state('');
	let localRarities = $state<CardRarity[]>([]);
	let localVariant = $state<CardVariant>('all');
	let pending = $state(false);

	$effect(() => {
		localQuery = query;
		localRarities = [...selectedRarities];
		localVariant = variant;
	});

	function scheduleSubmit(delay = 400) {
		window.clearTimeout(debounceTimer);
		pending = true;
		debounceTimer = window.setTimeout(() => form.requestSubmit(), delay);
	}
</script>

<form bind:this={form} method="GET">
	<CardSearchPanel class="forge-panel" contentClass="p-4 sm:p-5">
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
				onChange={() => scheduleSubmit(80)}
			/>
		</fieldset>
		<CardVariantSelector
			bind:value={localVariant}
			name="variant"
			onChange={() => scheduleSubmit(80)}
			class="mt-5"
		/>
		<p
			class="mt-3 min-h-4 text-[10px] font-bold tracking-wider text-[var(--energy-soft)] uppercase"
			aria-live="polite"
		>
			{pending ? $_('codex.filtersUpdating') : ''}
		</p>
	</CardSearchPanel>
</form>
