<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { WishlistRegistrySummary } from '$lib/types';

	let {
		cardId,
		wishlists,
		onToggle
	}: {
		cardId: string;
		wishlists: WishlistRegistrySummary[];
		onToggle: (wishlistId: string, selected: boolean) => void | Promise<void>;
	} = $props();

	let pendingIds = $state<string[]>([]);
	const isWishlisted = $derived(wishlists.some((wishlist) => wishlist.cardIds.includes(cardId)));

	async function toggle(wishlist: WishlistRegistrySummary) {
		if (pendingIds.includes(wishlist.id)) return;
		pendingIds = [...pendingIds, wishlist.id];
		try {
			await onToggle(wishlist.id, !wishlist.cardIds.includes(cardId));
		} finally {
			pendingIds = pendingIds.filter((id) => id !== wishlist.id);
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant={isWishlisted ? 'outline' : 'default'}>
				{isWishlisted ? $_('cardDetail.manage_wishlists') : $_('cardDetail.add_wishlist')}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content preventScroll={false} align="start" class="min-w-64">
		<DropdownMenu.Group>
			{#each wishlists as wishlist (wishlist.id)}
				<DropdownMenu.CheckboxItem
					checked={wishlist.cardIds.includes(cardId)}
					closeOnSelect={false}
					disabled={pendingIds.includes(wishlist.id)}
					onSelect={() => void toggle(wishlist)}
				>
					<span class="truncate">{wishlist.title}</span>
				</DropdownMenu.CheckboxItem>
			{:else}
				<DropdownMenu.Item disabled>{$_('cardDetail.no_wishlist')}</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
