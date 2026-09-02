<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { _ } from '$lib/i18n';
	import type { Friendship } from '$lib/types';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		friendship,
		onCancel
	}: {
		friendship: Friendship;
		onCancel: () => void;
	} = $props();
</script>

<article class="forge-panel flex min-w-0 items-center gap-3 p-3">
	<a
		href={resolve('/users/[id]', { id: friendship.user.id })}
		class="flex min-w-0 flex-1 items-center gap-3"
	>
		<UserAvatar
			image={friendship.user.avatarUrl}
			name={friendship.user.username}
			lastConnection={friendship.user.lastConnection}
		/>
		<div class="min-w-0">
			<h3 class="truncate text-lg font-black uppercase sm:text-xl">
				@{friendship.user.username}
			</h3>
			<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('friends.status_sent')}
			</p>
		</div>
	</a>
	<Button
		size="icon-sm"
		variant="outline"
		aria-label={$_('friends.cancel_request')}
		title={$_('friends.cancel_request')}
		onclick={onCancel}
	>
		<XIcon />
	</Button>
</article>
