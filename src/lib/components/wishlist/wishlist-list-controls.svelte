<script lang="ts">
	import CardSearchPanel from '$lib/components/cards/card-search-panel.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { Input } from '$lib/components/ui/input';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';
	import type { CardRarity, WishlistSort } from '$lib/types';

	let {
		query = $bindable(''),
		rarities = $bindable<CardRarity[]>([]),
		sortBy = $bindable<WishlistSort>('date'),
		sortDirection = $bindable<'ASC' | 'DESC'>('DESC'),
		onChange
	}: {
		query?: string;
		rarities?: CardRarity[];
		sortBy?: WishlistSort;
		sortDirection?: 'ASC' | 'DESC';
		onChange?: () => void;
	} = $props();
</script>

<CardSearchPanel>
	<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_10rem]">
		<Input
			bind:value={query}
			oninput={onChange}
			placeholder={$_('wishlist.search')}
			aria-label={$_('wishlist.search')}
		/>
		<select
			bind:value={sortBy}
			onchange={onChange}
			class="h-10 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-primary"
			aria-label={$_('wishlist.sort_label')}
		>
			<option value="date">{$_('wishlist.sort_date')}</option>
			<option value="name">{$_('collection.sortName')}</option>
			<option value="rarity">{$_('wishlist.sort_rarity')}</option>
		</select>
		<select
			bind:value={sortDirection}
			onchange={onChange}
			class="h-10 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-primary"
			aria-label={$_('codex.sortDirection')}
		>
			<option value="DESC">{$_('codex.descending')}</option>
			<option value="ASC">{$_('codex.ascending')}</option>
		</select>
	</div>
	<div class="mt-3">
		<RaritySelector options={cardRarityOptions} bind:selected={rarities} {onChange} />
	</div>
</CardSearchPanel>
