<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { WishlistRegistrySummary } from '$lib/types';
	import { toast } from 'svelte-sonner';

	let {
		wishlists,
		cardTitle,
		onToggle
	}: {
		wishlists: WishlistRegistrySummary[];
		cardTitle: string;
		onToggle: (wishlistId: string, selected: boolean) => void | Promise<void>;
	} = $props();

	let pendingIds = $state<string[]>([]);

	async function add(wishlist: WishlistRegistrySummary) {
		if (pendingIds.includes(wishlist.id)) return;
		pendingIds = [...pendingIds, wishlist.id];
		try {
			await onToggle(wishlist.id, true);
			toast.success(
				$_('wishlist.card_added', {
					values: { card: cardTitle, wishlist: wishlist.title }
				})
			);
		} finally {
			pendingIds = pendingIds.filter((id) => id !== wishlist.id);
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props}>{$_('cardDetail.add_wishlist')}</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content preventScroll={false} align="start" class="min-w-64" style="z-index:120">
		<DropdownMenu.Group>
			{#each wishlists as wishlist (wishlist.id)}
				<DropdownMenu.Item
					disabled={pendingIds.includes(wishlist.id)}
					onSelect={() => void add(wishlist)}
				>
					<span class="truncate">{wishlist.title}</span>
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item disabled>{$_('cardDetail.no_wishlist')}</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
