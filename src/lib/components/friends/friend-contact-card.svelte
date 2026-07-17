<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { Friendship } from '$lib/types';

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

<article class="forge-panel min-w-0 p-3 sm:p-4">
	<div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<a
			href={resolve('/users/[id]', { id: friendship.user.id })}
			class="flex min-w-0 items-center gap-3 sm:flex-1"
		>
			<img
				src={friendship.user.avatarUrl ?? '/card-placeholder.svg'}
				alt=""
				class="size-11 border border-primary/40 bg-background object-cover"
			/>
			<div class="min-w-0">
				<h2 class="break-words font-serif text-xl font-black uppercase">
					@{friendship.user.username}
				</h2>
				<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
					{blocked ? $_('friends.blocked_status') : $_(`friends.status_${friendship.status}`)}
				</p>
			</div>
		</a>
		<div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
			{#if friendship.status === 'received'}
				<Button size="sm" class="w-full sm:w-auto" onclick={onAccept}>
					{$_('friends.accept')}
				</Button>
				<Button size="sm" variant="outline" class="w-full sm:w-auto" onclick={onDecline}>
					{$_('friends.decline')}
				</Button>
			{:else}
				<Button
					size="sm"
					variant="outline"
					class="w-full sm:w-auto"
					disabled={blocked}
					onclick={onTrade}
				>
					{$_('friends.trade')}
				</Button>
				<Button
					size="sm"
					variant="outline"
					class="w-full sm:w-auto"
					disabled={blocked}
					onclick={onMessage}
				>
					{$_('friends.message')}
				</Button>
			{/if}
			<Button size="sm" variant={blocked ? 'default' : 'destructive'} onclick={onBlock}>
				{blocked ? $_('friends.unblock') : $_('friends.block')}
			</Button>
			<Button size="sm" variant="destructive" onclick={onRemove}>
				{$_('friends.remove')}
			</Button>
		</div>
	</div>
</article>
