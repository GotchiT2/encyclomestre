<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { _ } from '$lib/i18n';
	import type { UserBlock } from '$lib/types';

	let {
		blocks,
		onUnblock
	}: {
		blocks: UserBlock[];
		onUnblock: (block: UserBlock) => void;
	} = $props();
</script>

<div class="grid gap-3 lg:grid-cols-2">
	{#each blocks as block (block.user.id)}
		<article class="forge-panel flex min-w-0 items-center justify-between gap-3 p-4">
			<div class="min-w-0">
				<h2 class="break-words font-serif text-xl font-black uppercase">@{block.user.username}</h2>
				<p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
					{$_('friends.blocked_since', {
						values: { date: new Date(block.createdAt).toLocaleDateString('fr-FR') }
					})}
				</p>
			</div>
			<Button variant="outline" onclick={() => onUnblock(block)}>{$_('friends.unblock')}</Button>
		</article>
	{/each}
</div>
