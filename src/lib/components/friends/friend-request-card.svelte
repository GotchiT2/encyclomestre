<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { Friendship } from '$lib/types';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ShieldBanIcon from '@lucide/svelte/icons/shield-ban';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		friendship,
		onAccept,
		onDecline,
		onBlock
	}: {
		friendship: Friendship;
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
		<img
			src={friendship.user.avatarUrl ?? '/card-placeholder.svg'}
			alt=""
			class="size-10 shrink-0 border border-primary/40 bg-background object-cover"
		/>
		<div class="min-w-0">
			<h3 class="truncate font-serif text-lg font-black uppercase sm:text-xl">
				@{friendship.user.username}
			</h3>
			<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
				{$_('friends.status_received')}
			</p>
		</div>
	</a>
	<div class="flex shrink-0 items-center gap-1.5">
		<Button
			size="icon-sm"
			aria-label={$_('friends.accept')}
			title={$_('friends.accept')}
			onclick={onAccept}
		>
			<CheckIcon />
		</Button>
		<Button
			size="icon-sm"
			variant="outline"
			aria-label={$_('friends.decline')}
			title={$_('friends.decline')}
			onclick={onDecline}
		>
			<XIcon />
		</Button>
		<Button
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
