<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	let {
		open = $bindable(false),
		title,
		modalLayer,
		children
	}: { open?: boolean; title: string; modalLayer?: number; children: Snippet } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content {modalLayer} class="h-[min(92dvh,58rem)] max-w-7xl grid-rows-[auto_minmax(0,1fr)] gap-0">
		<div class="flex min-h-12 items-center border-b border-primary/20 px-4 py-2 pr-14">
			<Dialog.Title class="truncate text-lg leading-tight sm:text-xl">{title}</Dialog.Title>
		</div>
		{@render children()}
	</Dialog.Content>
</Dialog.Root>
