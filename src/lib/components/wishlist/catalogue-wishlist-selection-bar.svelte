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
		if (!wishlists.some((wishlist) => wishlist.id === wishlistId)) wishlistId = wishlists[0]?.id ?? '';
	});
</script>

<div class="forge-panel-flat flex flex-wrap items-center gap-2 p-2.5" data-testid="catalogue-wishlist-selection">
	<p class="mr-auto text-sm font-medium text-foreground">
		{$_('codex.selection_count', { values: { count } })}
	</p>
	<Button size="sm" variant="ghost" onclick={onSelectAll}>{$_('codex.select_all')}</Button>
	<select
		bind:value={wishlistId}
		class="h-9 min-w-40 border border-primary/35 bg-background px-2 text-sm text-foreground outline-none focus:border-energy"
		aria-label={$_('cardDetail.add_wishlist')}
	>
		{#each wishlists as wishlist (wishlist.id)}
			<option value={wishlist.id}>{wishlist.title}</option>
		{/each}
	</select>
	<Button size="sm" disabled={!count || !wishlistId || busy} onclick={() => void onAdd(wishlistId)}>
		{$_('codex.add_selection')}
	</Button>
	<Button size="sm" variant="outline" disabled={busy} onclick={onCancel}>{$_('common.cancel')}</Button>
</div>
