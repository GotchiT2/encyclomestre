<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CollectionTag } from '$lib/types';

	type SortBy = 'name' | 'rarity';
	type RarityOption = { value: CardRarity; initials: string; color: string };

	let {
		query = $bindable(''),
		sortBy = $bindable<SortBy>('rarity'),
		selectedRarities = $bindable<CardRarity[]>([]),
		tagFilterIds = $bindable<string[]>([]),
		tags,
		rarities,
		untaggedOption,
		newTagOption,
		allowTagCreation = true,
		onTagFilterChange,
		onClear
	}: {
		query: string;
		sortBy: SortBy;
		selectedRarities: CardRarity[];
		tagFilterIds: string[];
		tags: CollectionTag[];
		rarities: RarityOption[];
		untaggedOption: string;
		newTagOption: string;
		allowTagCreation?: boolean;
		onTagFilterChange: () => void;
		onClear: () => void;
	} = $props();
</script>

<Field.FieldGroup class="gap-3">
	<Field.Field>
		<Field.FieldLabel for="collection-search" class="sr-only"
			>{$_('collection.search')}</Field.FieldLabel
		>
		<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
			<Input
				id="collection-search"
				bind:value={query}
				placeholder={$_('collection.search')}
				aria-label={$_('collection.search')}
			/><select
				bind:value={sortBy}
				aria-label={$_('collection.sort')}
				class="h-11 w-full border border-primary/30 bg-background/70 px-3 text-[10px] font-bold tracking-wider text-foreground uppercase outline-none focus:border-[var(--energy-soft)] sm:w-44"
				><option value="name">{$_('collection.sortName')}</option><option value="rarity"
					>{$_('collection.sortRarity')}</option
				></select
			>
		</div>
	</Field.Field>
	<Field.FieldSet class="gap-2"
		><Field.FieldLegend class="sr-only">{$_('collection.rarities')}</Field.FieldLegend
		><ToggleGroup.Root
			bind:value={selectedRarities}
			type="multiple"
			variant="outline"
			spacing={1}
			class="w-full flex-wrap"
			>{#each rarities as rarity (rarity.value)}<ToggleGroup.Item
					value={rarity.value}
					aria-label={rarity.value}
					title={rarity.value}
					class="h-7 min-w-8 px-1.5 font-mono text-[10px] font-bold"
					style={`background-color:${rarity.color};color:#080A09`}
					>{rarity.initials}</ToggleGroup.Item
				>{/each}</ToggleGroup.Root
		></Field.FieldSet
	>
	<Field.Field
		><Field.FieldLabel
			for="collection-tags"
			class="font-mono text-[10px] uppercase tracking-[0.2em] text-primary"
			>{$_('collection.tags')}</Field.FieldLabel
		>
		<div
			class="border border-primary/25 bg-background/65 p-1 focus-within:border-[var(--energy-soft)]"
		>
			<select
				id="collection-tags"
				multiple
				size="4"
				bind:value={tagFilterIds}
				onchange={onTagFilterChange}
				class="min-h-24 w-full border-0 bg-card/70 px-3 py-2 text-xs font-bold tracking-[0.12em] text-foreground uppercase outline-none"
				aria-describedby="collection-tags-hint"
				><option value={untaggedOption}>{$_('collection.untagged')}</option
				>{#each tags as tag (tag.id)}<option value={tag.id}>{tag.name}</option
					>{/each}{#if allowTagCreation}<option value={newTagOption}
						>{$_('collection.addTagOption')}</option
					>{/if}</select
			>
		</div>
		<Field.FieldDescription id="collection-tags-hint"
			>{$_('collection.tagsHint')}</Field.FieldDescription
		></Field.Field
	>
</Field.FieldGroup>

{#if query || selectedRarities.length || tagFilterIds.length || sortBy !== 'rarity'}<Button
		size="sm"
		variant="ghost"
		class="w-fit"
		onclick={onClear}>{$_('collection.clearFilters')}</Button
	>{/if}
