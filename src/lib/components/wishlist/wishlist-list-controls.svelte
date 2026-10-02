<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { _ } from '$lib/i18n';
	import type { WishlistSort } from '$lib/types';

	let {
		query = $bindable(''),
		sortBy = $bindable<WishlistSort>('date'),
		sortDirection = $bindable<'ASC' | 'DESC'>('DESC'),
		onChange
	}: {
		query?: string;
		sortBy?: WishlistSort;
		sortDirection?: 'ASC' | 'DESC';
		onChange?: () => void;
	} = $props();
</script>

<div class="grid min-w-0 gap-2">
	<Input
		type="search"
		bind:value={query}
		oninput={onChange}
		aria-label={$_('wishlist.search')}
		placeholder={$_('wishlist.search')}
	/>
	<div class="flex min-w-0 gap-2 overflow-x-auto py-1">
		<label class="flex shrink-0 items-center gap-2 text-sm"
			>{$_('wishlist.sort_label')}
			<select bind:value={sortBy} onchange={onChange} class="w-auto">
				<option value="date">{$_('wishlist.sort_date')}</option><option value="name"
					>{$_('collection.sortName')}</option
				>
			</select>
		</label>
		<label class="flex shrink-0 items-center gap-2 text-sm"
			>{$_('codex.sortDirection')}
			<select bind:value={sortDirection} onchange={onChange} class="w-auto">
				<option value="DESC">{$_('codex.descending')}</option><option value="ASC"
					>{$_('codex.ascending')}</option
				>
			</select>
		</label>
	</div>
</div>
