<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { Friendship } from '$lib/types';
	import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import ShieldBanIcon from '@lucide/svelte/icons/shield-ban';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		friendship,
		blocked,
		onAccept,
		onDecline,
		onTrade,
		onMessage,
		onRemove,
		onBlock
	}: {
		friendship: Friendship;
		blocked: boolean;
		onAccept: () => void;
		onDecline: () => void;
		onTrade: () => void;
		onMessage: () => void;
		onRemove: () => void;
		onBlock: () => void;
	} = $props();
</script>

<article class="forge-panel min-w-0 p-3">
	<div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
		<a
			href={resolve('/users/[id]', { id: friendship.user.id })}
			class="flex min-w-0 items-center gap-3 sm:flex-1"
		>
			<img
				src={friendship.user.avatarUrl ?? '/card-placeholder.svg'}
				alt=""
				class="size-10 shrink-0 border border-primary/40 bg-background object-cover"
			/>
			<div class="min-w-0">
				<h2 class="truncate font-serif text-lg font-black uppercase sm:text-xl">
					@{friendship.user.username}
				</h2>
				<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
					{blocked ? $_('friends.blocked_status') : $_(`friends.status_${friendship.status}`)}
				</p>
			</div>
		</a>
		<div class="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:shrink-0">
			{#if friendship.status === 'received'}
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
			{:else}
				<Button
					size="icon-sm"
					variant="outline"
					disabled={blocked}
					aria-label={$_('friends.trade')}
					title={$_('friends.trade')}
					onclick={onTrade}
				>
					<ArrowLeftRightIcon />
				</Button>
				<Button
					size="icon-sm"
					variant="outline"
					disabled={blocked}
					aria-label={$_('friends.message')}
					title={$_('friends.message')}
					onclick={onMessage}
				>
					<MessageCircleIcon />
				</Button>
			{/if}
			<Button
				size="icon-sm"
				variant={blocked ? 'default' : 'destructive'}
				aria-label={blocked ? $_('friends.unblock') : $_('friends.block')}
				title={blocked ? $_('friends.unblock') : $_('friends.block')}
				onclick={onBlock}
			>
				{#if blocked}<ShieldCheckIcon />{:else}<ShieldBanIcon />{/if}
			</Button>
			<Button
				size="icon-sm"
				variant="destructive"
				aria-label={$_('friends.remove')}
				title={$_('friends.remove')}
				onclick={onRemove}
			>
				<UserMinusIcon />
			</Button>
		</div>
	</div>
</article>
