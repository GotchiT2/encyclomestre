<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { WishlistRegistrySummary } from '$lib/types';

	let {
		count,
		wishlists,
		busy = false,
		onAdd,
		onCancel,
		onSelectAll
	}: {
		count: number;
		wishlists: WishlistRegistrySummary[];
		busy?: boolean;
		onAdd: (wishlistId: string) => void | Promise<void>;
		onCancel: () => void;
		onSelectAll: () => void;
	} = $props();

	let wishlistId = $state('');
	$effect(() => {
		if (!wishlists.some((wishlist) => wishlist.id === wishlistId))
			wishlistId = wishlists[0]?.id ?? '';
	});
</script>

<div
	data-selection-panel
	class="fixed inset-x-0 bottom-0 z-50 flex max-h-[40dvh] flex-wrap items-center gap-2 overflow-y-auto border-t border-primary bg-card p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] md:left-[var(--sidebar-width)]"
	data-testid="catalogue-wishlist-selection"
>
	<p class="mr-auto text-sm font-medium text-foreground">
		{$_('codex.selection_count', { values: { count } })}
	</p>
	<Button size="sm" variant="ghost" onclick={onSelectAll}>{$_('arcade.loadedSelection')}</Button>
	<select
		bind:value={wishlistId}
		class="min-h-11 min-w-40 border border-primary/35 bg-background px-2 text-sm text-foreground outline-none focus:border-energy"
		aria-label={$_('cardDetail.add_wishlist')}
	>
		{#each wishlists as wishlist (wishlist.id)}
			<option value={wishlist.id}>{wishlist.title}</option>
		{/each}
	</select>
	<Button size="sm" disabled={!count || !wishlistId || busy} onclick={() => void onAdd(wishlistId)}>
		{$_('codex.add_selection')}
	</Button>
	<Button size="sm" variant="outline" disabled={busy} onclick={onCancel}
		>{$_('common.cancel')}</Button
	>
</div>
