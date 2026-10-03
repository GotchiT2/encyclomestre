<script lang="ts">
	import { _ } from '$lib/i18n';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { currentSession } from '$lib/auth/session';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import UsersIcon from '@lucide/svelte/icons/users';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { activeAuctionCardIds } from '$lib/auctions/store';
	import { articleContexts, observeArticle } from '$lib/arcade/article-context';
	import type { CardRecord, CollectionTag } from '$lib/types';
	let {
		card,
		tags = [],
		showFriendOwners = true,
		showCollectionState = true,
		interactive = true,
		comparisonOwnership
	}: {
		card: CardRecord;
		tags?: CollectionTag[];
		showFriendOwners?: boolean;
		showCollectionState?: boolean;
		interactive?: boolean;
		comparisonOwnership?: { count: number; label: string };
	} = $props();
	const articleId = $derived(String(card.baseCardId ?? card.catalogueId ?? card.id));
	const context = $derived($articleContexts[articleId]);
	const owned = $derived(context?.owned ?? (card.ownedCount > 0 ? card.ownedCount : undefined));
	const friends = $derived(context?.friends ?? card.friendsWhoOwn);
	const wishlists = $derived(
		context?.wishlists ??
			card.wishlistMemberships ??
			card.sharedWishlistMemberships?.filter((list) => list.userId === $currentSession?.user.id) ??
			[]
	);
</script>

<div class="card-information" use:observeArticle={articleId} data-testid="card-information">
	<div class="information-line">
		{#if showCollectionState && owned != null}<DropdownMenu.Root
				><DropdownMenu.Trigger
					disabled={!interactive}
					class="information-command"
					aria-label={$_('cardState.owned', { values: { count: owned } })}
					data-testid="ownership-count-owned"
					><LibraryIcon class="size-4" />{owned}</DropdownMenu.Trigger
				>
				<DropdownMenu.Content align="start" class="max-w-72"
					><p class="p-3 text-sm">{$_('arcade.ownedScope')}</p>
					<DropdownMenu.Item
						class="min-h-11"
						onSelect={() =>
							void goto(resolve(('/collection?q=' + encodeURIComponent(card.title)) as '/'))}
						>{$_('arcade.myCopies')}</DropdownMenu.Item
					></DropdownMenu.Content
				>
			</DropdownMenu.Root>{/if}
		{#if comparisonOwnership}<span
				class="information-command"
				aria-label={comparisonOwnership.label}
				><LibraryIcon class="size-4" />{comparisonOwnership.count}</span
			>{/if}
		{#if showFriendOwners && friends.length}<DropdownMenu.Root
				><DropdownMenu.Trigger
					disabled={!interactive}
					class="information-command"
					aria-label={$_('cardState.friend_owners', { values: { count: friends.length } })}
					data-testid="friend-ownership-chip"
					><UsersIcon class="size-4" />{friends.length}</DropdownMenu.Trigger
				>
				<DropdownMenu.Content align="start" class="min-w-56 max-w-80"
					>{#each friends as friend (friend.friendId)}<DropdownMenu.Item
							class="min-h-11"
							onSelect={() => void goto(resolve('/users/[id]', { id: friend.friendId }))}
							><UserAvatar name={friend.username} image={friend.avatarUrl} /><span
								class="min-w-0 truncate">{friend.username}</span
							></DropdownMenu.Item
						>{/each}</DropdownMenu.Content
				></DropdownMenu.Root
			>{/if}
		{#if showCollectionState}<DropdownMenu.Root
				><DropdownMenu.Trigger
					disabled={!interactive}
					class="information-command ml-auto"
					aria-label={$_('arcade.wishlist')}
					><HeartIcon
						class={wishlists.length > 0 ? 'size-4 fill-primary' : 'size-4'}
					/></DropdownMenu.Trigger
				>
				<DropdownMenu.Content align="end"
					><DropdownMenu.Label>{$_('arcade.wishlist')}</DropdownMenu.Label
					>{#each wishlists as wishlist (wishlist.id ?? wishlist.title)}<DropdownMenu.Item
							class="min-h-11"
							onSelect={() =>
								void goto(
									resolve(('/wishlists?list=' + encodeURIComponent(wishlist.id ?? '')) as '/')
								)}
							>{wishlist.defaultList
								? $_('cardState.default_wishlist')
								: wishlist.title}</DropdownMenu.Item
						>{/each}<DropdownMenu.Item
						class="min-h-11"
						onSelect={() => void goto(resolve('/wishlists'))}
						>{$_('navigation.wishlist')}</DropdownMenu.Item
					></DropdownMenu.Content
				></DropdownMenu.Root
			>{/if}
	</div>
	{#if card.userProtected || card.activeSale || card.saleId || card.activeAuctionId || $activeAuctionCardIds.has(card.id) || card.pendingTradeId}<div
			class="state-line"
		>
			{#if card.userProtected}<span data-testid="card-protected-indicator"
					>{$_('collection.protected_indicator')}</span
				>{/if}
			{#if card.activeSale || card.saleId}<span data-testid="card-active-sale"
					>{$_('collection.on_sale')}</span
				>{/if}
			{#if card.activeAuctionId || $activeAuctionCardIds.has(card.id)}<span
					data-testid="card-active-auction">{$_('collection.on_auction')}</span
				>{/if}
			{#if card.pendingTradeId}<span>{$_('arcade.pendingTrade')}</span>{/if}
		</div>{/if}
	{#if tags.length}<DropdownMenu.Root
			><DropdownMenu.Trigger
				disabled={!interactive}
				class="tag-line"
				aria-label={$_('arcade.moreTags')}
				data-testid="card-tag-bookmarks"
				><span style={`border-color:${tags[0].color}`}>{tags[0].name}</span
				>{#if tags.length > 1}<span>+{tags.length - 1}</span>{/if}</DropdownMenu.Trigger
			><DropdownMenu.Content align="start"
				>{#each tags as tag (tag.id)}<DropdownMenu.Item disabled>{tag.name}</DropdownMenu.Item
					>{/each}</DropdownMenu.Content
			></DropdownMenu.Root
		>{/if}
</div>

<style>
	.card-information {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}
	.information-line {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		border-bottom: 1px solid var(--border);
		gap: 0.2rem;
	}
	.card-information :global(.information-command) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		min-height: 44px;
		min-width: 44px;
		padding: 0.4rem;
		font:
			600 0.875rem 'Barlow',
			sans-serif;
		font-variant-numeric: tabular-nums;
	}
	.card-information :global(.information-command:hover) {
		background: var(--muted);
	}
	.state-line {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--foreground);
	}
	.state-line span {
		border-left: 2px solid var(--primary);
		padding-left: 0.3rem;
	}
	.card-information :global(.tag-line) {
		display: flex;
		gap: 0.35rem;
		align-items: center;
		min-height: 44px;
		min-width: 44px;
		max-width: 100%;
		font-size: 0.75rem;
	}
	.card-information :global(.tag-line span:first-child) {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border-left: 3px solid;
		padding: 0.2rem 0.4rem;
	}
</style>
