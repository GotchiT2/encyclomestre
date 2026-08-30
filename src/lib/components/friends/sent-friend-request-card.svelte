<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
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
		<img
			src={friendship.user.avatarUrl ?? '/card-placeholder.svg'}
			alt=""
			class="size-10 shrink-0 border border-primary/40 bg-background object-cover"
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
