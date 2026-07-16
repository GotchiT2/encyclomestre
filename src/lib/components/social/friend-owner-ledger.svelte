<script lang="ts">
	import { _ } from '$lib/i18n';
	import type { FriendOwnerInfo } from '$lib/types';

	let { friends }: { friends: FriendOwnerInfo[] } = $props();
</script>

<div>
	<p class="font-mono text-[10px] uppercase tracking-widest text-primary">{$_('codex.friends')}</p>
	{#if friends.length}<ul class="mt-3 divide-y divide-primary/10 border-y border-primary/10">
			{#each friends as friend (friend.friendId)}<li
					class="flex items-center justify-between gap-3 py-3 font-mono text-[10px] uppercase tracking-widest text-foreground"
				>
					<a href={`/users/${friend.friendId}`} class="truncate hover:text-primary"
						>@{friend.username}</a
					><span class="text-primary">×{friend.ownedCount}</span>
				</li>{/each}
		</ul>{:else}<p class="mt-3 font-serif italic text-muted-foreground">
			{$_('codex.noFriends')}
		</p>{/if}
</div>
