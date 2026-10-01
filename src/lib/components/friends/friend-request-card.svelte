<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import UserAvatar from '$lib/components/users/user-avatar.svelte';
	import { _ } from '$lib/i18n';
	import type { Friendship } from '$lib/types';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ShieldBanIcon from '@lucide/svelte/icons/shield-ban';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		friendship,
		busy = false,
		onAccept,
		onDecline,
		onBlock
	}: {
		friendship: Friendship;
		busy?: boolean;
		onAccept: () => void;
		onDecline: () => void;
		onBlock: () => void;
	} = $props();
</script>

<article class="forge-panel flex min-w-0 items-center gap-3 p-3">
	<a
		href={resolve('/users/[id]', { id: friendship.user.id })}
		class="flex min-w-0 flex-1 items-center gap-3"
	>
		<UserAvatar
			image={friendship.user.avatarUrl}
			crop={friendship.user.imageCrop}
			name={friendship.user.username}
			lastConnection={friendship.user.lastConnection}
		/>
		<div class="min-w-0">
			<h3 class="truncate text-lg font-black uppercase sm:text-xl">
				@{friendship.user.username}
			</h3>
			<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('friends.status_received')}
			</p>
		</div>
	</a>
	<div class="flex shrink-0 items-center gap-1.5">
		<Button
			disabled={busy}
			size="icon-sm"
			aria-label={$_('friends.accept')}
			title={$_('friends.accept')}
			onclick={onAccept}
		>
			<CheckIcon />
		</Button>
		<Button
			disabled={busy}
			size="icon-sm"
			variant="outline"
			aria-label={$_('friends.decline')}
			title={$_('friends.decline')}
			onclick={onDecline}
		>
			<XIcon />
		</Button>
		<Button
			disabled={busy}
			size="icon-sm"
			variant="destructive"
			aria-label={$_('friends.block')}
			title={$_('friends.block')}
			onclick={onBlock}
		>
			<ShieldBanIcon />
		</Button>
	</div>
</article>
