<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import CardVariantSelector from '$lib/components/cards/card-variant-selector.svelte';
	import RaritySelector from '$lib/components/cards/rarity-selector.svelte';
	import { cardRarityOptions } from '$lib/domain/cards/rarities';
	import { _ } from '$lib/i18n';
	import type { CardRarity, CardVariant, WishlistPriority } from '$lib/types';

	let {
		query = $bindable(''),
		selectedRarities = $bindable<CardRarity[]>([]),
		priority = $bindable<WishlistPriority | ''>(''),
		hasAlert = $bindable(false),
		variant = $bindable<CardVariant>('all')
	}: {
		query?: string;
		selectedRarities?: CardRarity[];
		priority?: WishlistPriority | '';
		hasAlert?: boolean;
		variant?: CardVariant;
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
	<div class="mt-3">
		<RaritySelector options={cardRarityOptions} bind:selected={selectedRarities} />
	</div>
	<CardVariantSelector bind:value={variant} class="mt-3" />
</div>
