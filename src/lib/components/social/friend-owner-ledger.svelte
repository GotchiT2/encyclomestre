<script lang="ts">
	import { resolve } from '$app/paths';
	import { _ } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import type { FriendOwnerInfo } from '$lib/types';

	let {
		friends,
		onPrepareTrade
	}: {
		friends: FriendOwnerInfo[];
		onPrepareTrade?: (friend: FriendOwnerInfo) => void;
	} = $props();
</script>

<div>
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('codex.friends')}</p>
	{#if friends.length}
		<ul class="mt-3 divide-y divide-primary/10 border-y border-primary/10">
			{#each friends as friend (friend.friendId)}
				<li
					class="flex items-center justify-between gap-3 py-3 font-mono text-[10px] uppercase tracking-widest"
				>
					<a
						href={resolve('/users/[id]', { id: friend.friendId })}
						class="truncate hover:text-primary">@{friend.username}</a
					>
					{#if onPrepareTrade}
						<Button
							size="sm"
							variant="outline"
							class="h-7 px-2 text-[9px]"
							onclick={() => onPrepareTrade(friend)}>×{friend.ownedCount}</Button
						>
					{:else}<span class="text-energy">×{friend.ownedCount}</span>{/if}
				</li>
			{/each}
		</ul>
	{:else}<p class="mt-3 italic text-muted-foreground">{$_('codex.noFriends')}</p>{/if}
</div>
