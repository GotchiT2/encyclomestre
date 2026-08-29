<script lang="ts">
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import * as Field from '$lib/components/ui/field';
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

<Field.FieldGroup class="gap-5">
	<Field.Field>
		<Field.FieldLabel for="wishlist-search" class="forge-label">
			{$_('wishlist.search')}
		</Field.FieldLabel>
		<Input
			id="wishlist-search"
			bind:value={query}
			oninput={onChange}
			placeholder={$_('wishlist.search')}
		/>
	</Field.Field>

	<div class="grid gap-3 @lg:grid-cols-2">
		<Field.Field>
			<Field.FieldLabel for="wishlist-sort" class="forge-label">
				{$_('wishlist.sort_label')}
			</Field.FieldLabel>
			<select id="wishlist-sort" bind:value={sortBy} onchange={onChange} class="w-full">
				<option value="date">{$_('wishlist.sort_date')}</option>
				<option value="name">{$_('collection.sortName')}</option>
				<option value="rarity">{$_('wishlist.sort_rarity')}</option>
			</select>
		</Field.Field>
		<Field.Field>
			<Field.FieldLabel for="wishlist-sort-direction" class="forge-label">
				{$_('codex.sortDirection')}
			</Field.FieldLabel>
			<select
				id="wishlist-sort-direction"
				bind:value={sortDirection}
				onchange={onChange}
				class="w-full"
			>
				<option value="DESC">{$_('codex.descending')}</option>
				<option value="ASC">{$_('codex.ascending')}</option>
			</select>
		</Field.Field>
	</div>

	<Field.FieldSet class="gap-2">
		<Field.FieldLegend class="forge-label">{$_('codex.rarities')}</Field.FieldLegend>
		<RaritySelector options={cardRarityOptions} bind:selected={rarities} compact {onChange} />
	</Field.FieldSet>
</Field.FieldGroup>
