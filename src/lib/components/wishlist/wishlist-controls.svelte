<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { _ } from '$lib/i18n';
	import type { CardRarity, WishlistPriority } from '$lib/types';

	const rarities: { value: CardRarity; initials: string; color: string }[] = [
		{ value: 'KTD', initials: 'KTD', color: '#1dcf47' },
		{ value: 'Légendaire', initials: 'L', color: '#cf1d1d' },
		{ value: 'Ultra-Rare', initials: 'UR', color: '#cf7d1d' },
		{ value: 'Super-Rare', initials: 'SR', color: '#b41dcf' },
		{ value: 'Rare', initials: 'R', color: '#5c1dcf' },
		{ value: 'Peu Commune', initials: 'PC', color: '#1d71cf' },
		{ value: 'Commune', initials: 'C', color: '#d3e4f8' }
	];

	let {
		query = $bindable(''),
		selectedRarities = $bindable<CardRarity[]>([]),
		priority = $bindable<WishlistPriority | ''>(''),
		hasAlert = $bindable(false)
	}: {
		query?: string;
		selectedRarities?: CardRarity[];
		priority?: WishlistPriority | '';
		hasAlert?: boolean;
	} = $props();
</script>

<div class="border-4 border-double border-primary/30 bg-card p-3">
	<div class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_11rem_auto]">
		<Input
			bind:value={query}
			placeholder={$_('wishlist.search')}
			aria-label={$_('wishlist.search')}
		/>
		<select
			bind:value={priority}
			aria-label={$_('wishlist.priority')}
			class="h-10 border-2 border-primary/40 bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-primary outline-none focus:border-primary"
		>
			<option value="">{$_('wishlist.all_priorities')}</option>
			<option value="high">{$_('wishlist.priority_high')}</option>
			<option value="medium">{$_('wishlist.priority_medium')}</option>
			<option value="low">{$_('wishlist.priority_low')}</option>
		</select>
		<label
			class="flex h-10 items-center gap-2 border border-primary/30 px-3 font-mono text-[10px] uppercase tracking-wider text-primary"
		>
			<input bind:checked={hasAlert} type="checkbox" class="size-4 accent-primary" />
			{$_('wishlist.with_alerts')}
		</label>
	</div>
	<ToggleGroup.Root
		bind:value={selectedRarities}
		type="multiple"
		variant="outline"
		spacing={1}
		class="mt-3 w-full flex-wrap"
	>
		{#each rarities as rarity (rarity.value)}
			<ToggleGroup.Item
				value={rarity.value}
				aria-label={rarity.value}
				class="h-7 min-w-8 px-1.5 font-mono text-[10px] font-bold"
				style={`background-color:${rarity.color};color:#080f19`}>{rarity.initials}</ToggleGroup.Item
			>
		{/each}
	</ToggleGroup.Root>
</div>
