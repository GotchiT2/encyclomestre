<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { _ } from '$lib/i18n';
	import BookMarkedIcon from '@lucide/svelte/icons/book-marked';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { CardWishlistReference, FriendOwnerInfo } from '$lib/types';

	let {
		ownedCount = 0,
		wishlists = [],
		owners = []
	}: {
		ownedCount?: number;
		wishlists?: CardWishlistReference[];
		owners?: FriendOwnerInfo[];
	} = $props();

	const wishlistNames = $derived(
		wishlists.map((wishlist) =>
			wishlist.defaultList ? $_('cardState.default_wishlist') : (wishlist.title ?? '')
		)
	);
</script>

<div
	class="pointer-events-auto flex flex-col items-start gap-1"
	data-testid="card-state-indicators"
>
	{#if ownedCount > 0}
		<span
			class="flex min-h-7 items-center gap-1 border border-emerald-300/60 bg-background/90 px-1.5 font-mono text-[9px] font-bold text-emerald-200 shadow-lg"
			aria-label={$_('cardState.owned', { values: { count: ownedCount } })}
			title={$_('cardState.owned', { values: { count: ownedCount } })}
		>
			<LibraryIcon class="size-3.5" /><span aria-hidden="true">×{ownedCount}</span>
		</span>
	{/if}
	{#if wishlists.length}
		<span
			class="flex min-h-7 items-center gap-1 border border-primary/60 bg-background/90 px-1.5 font-mono text-[9px] font-bold text-primary shadow-lg"
			aria-label={$_('cardState.wishlisted', { values: { count: wishlists.length } })}
			title={wishlistNames.join(' · ')}
		>
			<BookMarkedIcon class="size-3.5" /><span aria-hidden="true">×{wishlists.length}</span>
		</span>
	{/if}
	{#if owners.length}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex min-h-7 cursor-pointer items-center gap-1 border border-primary/60 bg-background/90 px-1.5 font-mono text-[9px] font-bold text-primary shadow-lg"
				aria-label={$_('cardState.other_owners', { values: { count: owners.length } })}
			>
				<UsersIcon class="size-3.5" /><span aria-hidden="true">×{owners.length}</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				preventScroll={false}
				align="start"
				sideOffset={6}
				class="min-w-44 border border-primary/40 bg-card p-1 shadow-2xl"
			>
				{#each owners as owner (owner.friendId)}
					<DropdownMenu.Item
						onSelect={() => void goto(resolve('/users/[id]', { id: owner.friendId }))}
						class="min-h-9 justify-between"
					>
						<span class="truncate">@{owner.username}</span><span>×{owner.ownedCount}</span>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
</div>
