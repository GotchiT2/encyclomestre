<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import type { WishlistGroups, WishlistRegistrySummary } from '$lib/types';

	let {
		groups,
		activeId,
		onSelect,
		onCreate,
		onEdit,
		onDelete,
		onAccept,
		onDecline,
		onLeave
	}: {
		groups: WishlistGroups;
		activeId: string | null;
		onSelect: (wishlist: WishlistRegistrySummary) => void;
		onCreate: () => void;
		onEdit: (wishlist: WishlistRegistrySummary) => void;
		onDelete: (wishlist: WishlistRegistrySummary) => void;
		onAccept: (wishlist: WishlistRegistrySummary) => void | Promise<void>;
		onDecline: (wishlist: WishlistRegistrySummary) => void | Promise<void>;
		onLeave: (wishlist: WishlistRegistrySummary) => void | Promise<void>;
	} = $props();
	const all = $derived([...groups.owned, ...groups.shared]);
</script>

<section class="wishlist-index" data-testid="wishlist-hub">
	<header>
		<h2>{$_('wishlist.owned_lists')}</h2>
		<Button onclick={onCreate} size="sm">{$_('wishlist.create_btn')}</Button>
	</header>
	<select
		class="mobile-list-choice"
		aria-label={$_('wishlist.hub_title')}
		value={activeId ?? ''}
		onchange={(event) => {
			const list = all.find((list) => list.id === event.currentTarget.value);
			if (list) onSelect(list);
		}}
	>
		{#each all as list (list.id)}<option value={list.id}>{list.title}</option>{/each}
	</select>
	<div class="list-index-entries">
		{#each all as list (list.id)}{#if list.id === groups.shared[0]?.id}<p
					class="shared-label text-sm text-muted-foreground pt-3"
				>
					{$_('wishlist.shared_lists')}
				</p>{/if}
			<article class:active={list.id === activeId}>
				<button
					class="choose-list"
					onclick={() => onSelect(list)}
					aria-pressed={list.id === activeId}
					>{#if list.imageUrl}<img
							class="size-8 object-cover shrink-0"
							src={list.imageUrl}
							alt=""
						/>{/if}<span>{list.title}</span>{#if list.cardCount != null}<span
							class="text-xs tabular-nums">{list.cardCount}</span
						>{/if}</button
				>
				{#if list.id === activeId}<div class="list-tools">
						{#if list.imageUrl}<img
								class="size-8 object-cover lg:hidden"
								src={list.imageUrl}
								alt=""
							/>{/if}
						{#if list.access === 'owned'}<Button
								variant="ghost"
								size="icon"
								aria-label={$_('wishlist.edit_registry')}
								onclick={() => onEdit(list)}><PencilIcon /></Button
							><Button
								variant="ghost"
								size="icon"
								aria-label={$_('wishlist.delete_registry')}
								onclick={() => onDelete(list)}><Trash2Icon /></Button
							>
						{:else}<Button variant="ghost" onclick={() => void onLeave(list)}
								>{$_('wishlist.leave')}</Button
							>{/if}
					</div>{/if}
			</article>{/each}
	</div>
	<details class="invitation-folder">
		<summary>{$_('wishlist.pending_invitations')} · {groups.pending.length}</summary>
		{#each groups.pending as list (list.id)}<div class="invitation-row">
				<span
					><strong>{list.title}</strong><span class="block text-xs text-muted-foreground"
						>{list.ownerName ?? '—'}</span
					></span
				><Button
					size="icon"
					aria-label={$_('wishlist.accept_invitation')}
					onclick={() => void onAccept(list)}><CheckIcon /></Button
				><Button
					variant="outline"
					size="icon"
					aria-label={$_('wishlist.decline_invitation')}
					onclick={() => void onDecline(list)}><XIcon /></Button
				>
			</div>
		{:else}<p class="py-3 text-sm text-muted-foreground">
				{$_('wishlist.no_pending_invitations')}
			</p>{/each}
	</details>
</section>

<style>
	.wishlist-index {
		display: grid;
		align-content: start;
		gap: 12px;
		min-width: 0;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	h2 {
		font-size: 18px;
	}
	select {
		width: 100%;
		min-height: 44px;
		border: 1px solid var(--border);
		padding: 8px;
	}
	.list-index-entries {
		display: grid;
		gap: 6px;
	}
	article {
		border-left: 2px solid var(--border);
	}
	article.active {
		border-color: var(--primary);
		background: var(--muted);
	}
	.choose-list {
		display: flex;
		width: 100%;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		text-align: left;
	}
	.choose-list > span:first-child {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.list-tools {
		display: flex;
		justify-content: flex-end;
	}
	.invitation-folder {
		border-top: 1px solid var(--border);
		font-size: 13px;
	}
	summary {
		cursor: pointer;
		padding: 8px 0;
	}
	.invitation-row {
		display: flex;
		gap: 6px;
		align-items: center;
		padding-block: 8px;
	}
	.invitation-row > span {
		min-width: 0;
		flex: 1;
		overflow-wrap: anywhere;
	}
	@media (min-width: 1024px) {
		.wishlist-index {
			position: sticky;
			top: 84px;
			max-height: calc(100dvh - 100px);
			overflow: auto;
			padding-right: 16px;
			border-right: 1px solid var(--border);
		}
		.mobile-list-choice {
			display: none;
		}
	}
	@media (max-width: 1023px) {
		.list-index-entries article:not(.active) {
			display: none;
		}
		.choose-list {
			display: none;
		}
		.list-tools {
			justify-content: flex-start;
		}
		.list-index-entries {
			display: none;
		}
		.wishlist-index:has(.list-tools) .list-index-entries {
			display: block;
		}
	}
</style>
