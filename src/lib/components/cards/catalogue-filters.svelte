<script lang="ts">
	import { Button } from '$lib/components/ui/button';
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

	const rarityColors: Record<CardRarity, string> = {
		Commune: '#d3e4f8',
		'Peu Commune': '#1d71cf',
		Rare: '#5c1dcf',
		'Super-Rare': '#b41dcf',
		'Ultra-Rare': '#cf7d1d',
		Légendaire: '#cf1d1d',
		KTD: '#1dcf47'
	};
</script>

<form method="GET" class="forge-panel p-4 sm:p-5">
	<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_9rem_auto]">
		<Input name="q" value={query} placeholder={$_('codex.search')} class="bg-background/70" />
		<select
			name="sortBy"
			class="h-11 border border-primary/30 bg-background/70 px-3 text-xs font-bold tracking-wider text-foreground uppercase outline-none focus:border-[var(--energy-soft)]"
		>
			<option value="rarity" selected={sortBy === 'rarity'}>{$_('collection.sortRarity')}</option>
			<option value="name" selected={sortBy === 'name'}>{$_('collection.sortName')}</option>
		</select>
		<select
			name="sortDirection"
			class="h-11 border border-primary/30 bg-background/70 px-3 text-xs font-bold tracking-wider text-foreground uppercase outline-none focus:border-[var(--energy-soft)]"
		>
			<option value="DESC" selected={sortDirection === 'DESC'}>{$_('codex.descending')}</option>
			<option value="ASC" selected={sortDirection === 'ASC'}>{$_('codex.ascending')}</option>
		</select>
		<Button type="submit">{$_('common.filter')}</Button>
	</div>
	<fieldset class="mt-4">
		<legend class="forge-label mb-2">{$_('codex.rarities')}</legend>
		<div class="flex flex-wrap gap-2">
			{#each rarities as rarity (rarity)}
				<label class="relative cursor-pointer">
					<input
						class="peer sr-only"
						type="checkbox"
						name="rarity"
						value={rarity}
						checked={selectedRarities.includes(rarity)}
					/>
					<span
						class="flex min-h-11 items-center border border-primary/20 bg-background/65 px-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
						style={`--rarity-color:${rarityColors[rarity]};border-left:3px solid var(--rarity-color)`}
					>
						{rarity}
					</span>
				</label>
			{/each}
		</div>
	</fieldset>
</form>
