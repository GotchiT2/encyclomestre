<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import type { MarketSort } from '$lib/domain/market/auction-display';
	import type { CardRarity, CardVariant } from '$lib/types';

	let {
		query = $bindable(''),
		variant = $bindable<CardVariant>('all'),
		rarities = $bindable<CardRarity[]>([]),
		sort = $bindable<MarketSort>('ending'),
		onSearch,
		onFilterChange
	}: {
		query: string;
		variant: CardVariant;
		rarities: CardRarity[];
		sort: MarketSort;
		onSearch: () => void;
		onFilterChange: () => void;
	} = $props();
</script>

<form
	class="forge-panel flex flex-wrap gap-2 p-3"
	onsubmit={(event) => {
		event.preventDefault();
		onSearch();
	}}
>
	<Input
		bind:value={query}
		class="min-w-48 flex-1"
		placeholder={$_('market.search')}
		oninput={onSearch}
	/>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="forge-control flex min-h-11 items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-widest"
		>
			<SlidersHorizontalIcon class="size-4" />
			{$_('market.filters')}
			<ChevronDownIcon class="size-3" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content
			preventScroll={false}
			align="end"
			sideOffset={8}
			class="min-w-52 border border-primary/35 bg-popover p-2 shadow-2xl"
		>
			<DropdownMenu.Label>{$_('cards.variant.label')}</DropdownMenu.Label>
			<DropdownMenu.RadioGroup bind:value={variant} onValueChange={onFilterChange}>
				{#each ['all', 'normal', 'alternative'] as option (option)}
					<DropdownMenu.RadioItem value={option}
						>{$_(`cards.variant.${option}`)}</DropdownMenu.RadioItem
					>
				{/each}
			</DropdownMenu.RadioGroup>
			<DropdownMenu.Separator />
			<DropdownMenu.Label>{$_('codex.rarities')}</DropdownMenu.Label>
			<div class="max-w-72 p-1">
				<RaritySelector
					options={cardRarityOptions}
					bind:selected={rarities}
					onChange={onFilterChange}
				/>
			</div>
			<DropdownMenu.Separator />
			<DropdownMenu.Label>{$_('market.sort')}</DropdownMenu.Label>
			<DropdownMenu.RadioGroup bind:value={sort} onValueChange={onFilterChange}>
				{#each ['ending', 'bid_desc', 'bid_asc'] as option (option)}
					<DropdownMenu.RadioItem value={option}
						>{$_(`market.sort_${option}`)}</DropdownMenu.RadioItem
					>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</form>
